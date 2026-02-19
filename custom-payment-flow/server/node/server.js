const express = require('express');
const cors = require('cors');
const app = express();
const {resolve} = require('path');
const env = require('dotenv').config({path: './.env'});
const calculateTax = false;

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: {
    // For sample support and debugging, not required for production:
    name: 'stripe-samples/accept-a-payment/custom-payment-flow',
    version: '0.0.2',
    url: 'https://github.com/stripe-samples',
  },
});

// Initialize the generated unified payment SDK
const { createPaymentClient } = require('unified-payment-sdk');

const paymentClient = createPaymentClient({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    apiVersion: '2023-10-16',
    btApiKey: process.env.BT_PRIVATE_API_KEY,
  },
  checkout: process.env.CHECKOUT_SECRET_KEY ? {
    secretKey: process.env.CHECKOUT_SECRET_KEY,
    processingChannelId: process.env.CHECKOUT_PROCESSING_CHANNEL_ID || '',
    isTest: true,
    btApiKey: process.env.BT_PRIVATE_API_KEY,
  } : undefined,
});

const calculate_tax = async (orderAmount, currency) => {
  const taxCalculation = await stripe.tax.calculations.create({
    currency,
    customer_details: {
      address: {
        line1: "10709 Cleary Blvd",
        city: "Plantation",
        state: "FL",
        postal_code: "33322",
        country: "US",
      },
      address_source: "shipping",
    },
    line_items: [
      {
        amount: orderAmount,
        reference: "ProductRef",
        tax_behavior: "exclusive",
        tax_code: "txcd_30011000"
      }
    ],
  });

  return taxCalculation;
};

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);

// Determine which processor to route to based on card details from the token
function determineProcessor(cardDetails) {
  if (!cardDetails) {
    return {
      processor: 'stripe',
      reason: 'Default fallback - no card details available',
      confidence: 50
    };
  }

  const { brand, funding, segment, issuer_country } = cardDetails;
  const countryCode = issuer_country?.alpha2 || cardDetails.issuer?.country;

  if (funding && funding.toLowerCase() === 'debit') {
    return {
      processor: 'checkout',
      reason: 'Debit cards route to Checkout.com for lower interchange fees',
      confidence: 85
    };
  }

  if (countryCode && countryCode !== 'US') {
    return {
      processor: 'checkout',
      reason: 'International cards route to Checkout.com for better coverage',
      confidence: 90
    };
  }

  if (segment && segment.toLowerCase() === 'commercial') {
    return {
      processor: 'checkout',
      reason: 'Commercial cards route to Checkout.com for B2B optimization',
      confidence: 80
    };
  }

  if (brand && brand.toLowerCase() === 'american express') {
    return {
      processor: 'stripe',
      reason: 'American Express cards route to Stripe for better auth rates',
      confidence: 85
    };
  }

  // Default to Stripe for US consumer credit cards
  return {
    processor: 'stripe',
    reason: 'US consumer credit cards route to Stripe (primary processor)',
    confidence: 75
  };
}

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/card.html');
  res.sendFile(path);
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { tokenId, amount, currency, customerName, cardDetails } = req.body;

    console.log('Processing payment:', { tokenId, amount, currency, customerName });

    // Step 1: Route based on card details returned on the token
    const routingDecision = determineProcessor(cardDetails);
    console.log('Routing decision:', routingDecision);

    // Step 2: Build the SDK transaction request
    const transactionRequest = {
      amount: {
        value: amount,
        currency: currency,
      },
      source: {
        type: 'basis_theory_token',
        id: tokenId,
        holderName: customerName,
      },
      reference: 'order-' + Date.now(),
      metadata: {
        routedProcessor: routingDecision.processor,
        routingReason: routingDecision.reason,
      },
    };

    // Step 3: Authorize via the generated SDK
    const result = await paymentClient.authorize(
      routingDecision.processor,
      transactionRequest
    );

    console.log('Payment result:', result);

    // Step 4: Return unified response
    const response = {
      success: result.status.code === 'authorized',
      transactionId: result.id,
      status: result.status.code,
      processor: routingDecision.processor,
      routingDecision: routingDecision,
      cardDetails: cardDetails,
      result: result,
    };

    res.send(response);

  } catch (error) {
    console.error('Payment processing error:', error);

    // TransactionError from the SDK includes structured error info
    if (error.response) {
      return res.status(400).send({
        error: { message: error.message },
        errorCodes: error.response.errorCodes,
        providerErrors: error.response.providerErrors,
      });
    }

    res.status(500).send({
      error: { message: error.message }
    });
  }
});

app.get('/payment/next', async (req, res) => {
  const intent = await stripe.paymentIntents.retrieve(
    req.query.payment_intent,
    {
      expand: ['payment_method'],
    }
  );

  res.redirect(`/success?payment_intent_client_secret=${intent.client_secret}`);
});

app.get('/success', async (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/success.html');
  res.sendFile(path);
});

// Expose a endpoint as a webhook handler for asynchronous events.
// Configure your webhook in the stripe developer dashboard
// https://dashboard.stripe.com/test/webhooks
app.post('/webhook', async (req, res) => {
  let data, eventType;

  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // we can retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
  } else if (eventType === 'payment_intent.payment_failed') {
    console.log('❌ Payment failed.');
  }
  res.sendStatus(200);
});

app.listen(4242, () =>
  console.log(`Node server listening at http://localhost:4242`)
);
