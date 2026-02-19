document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Basis Theory — replace with your public key
  const bt = await basistheory('your_bt_public_key_here');

  let cardElement;

  try {
    cardElement = bt.createElement('card', {
      targetId: 'card-element',
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    });
    cardElement.mount('#card-element');
  } catch (error) {
    console.error('Failed to initialize BT Elements:', error);
    addMessage('Failed to initialize payment form. Please refresh and try again.');
    return;
  }

  // Handle real-time validation
  cardElement.on('change', (event) => {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });

  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if(submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    addMessage('Tokenizing payment method...');

    try {
      // Tokenize the card with Basis Theory
      // The returned token includes card details (brand, funding, segment, issuer, etc.)
      const token = await bt.tokens.create({
        type: 'card',
        data: cardElement
      });

      addMessage(`Card tokenized successfully! Token: ${token.id}`);

      // The token.card property has BIN details from the token response:
      // { bin, last4, brand, funding, segment, issuer, issuer_country, ... }
      const cardDetails = token.card;

      // Display card info from the token
      if (cardDetails) {
        displayCardInfo(cardDetails);
      }

      // Get cardholder name
      const nameInput = document.querySelector('#name');

      // Send token ID and card details to the server for routing + payment
      const paymentRequest = {
        tokenId: token.id,
        amount: 5999, // $59.99
        currency: 'usd',
        customerName: nameInput.value,
        cardDetails: cardDetails,
      };

      addMessage('Processing payment with intelligent routing...');

      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      }).then((r) => r.json());

      if (response.error) {
        addMessage(`Payment failed: ${response.error.message}`);
        return;
      }

      // Display routing decision
      displayRoutingInfo(response.routingDecision, response.cardDetails);

      if (response.status === 'authorized') {
        addMessage(`Payment authorized successfully!`);
        addMessage(`Transaction ID: ${response.transactionId}`);
        addMessage(`Processor: ${response.processor}`);
      } else if (response.status === 'declined') {
        addMessage(`Payment declined: ${response.result?.responseCode?.code || 'Unknown reason'}`);
      } else {
        addMessage(`Payment status: ${response.status}`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      addMessage(`Payment failed: ${error.message}`);
    } finally {
      // Re-enable the form
      submitted = false;
      form.querySelector('button').disabled = false;
    }
  });

  function displayCardInfo(cardDetails) {
    const binDetails = document.getElementById('bin-details');
    let binHtml = `<strong>Card Information:</strong><br>`;

    if (cardDetails.brand) {
      binHtml += `Brand: ${cardDetails.brand}<br>`;
    }
    if (cardDetails.funding) {
      binHtml += `Type: ${cardDetails.funding}<br>`;
    }
    if (cardDetails.segment) {
      binHtml += `Segment: ${cardDetails.segment}<br>`;
    }
    if (cardDetails.issuer?.name) {
      binHtml += `Issuer: ${cardDetails.issuer.name}<br>`;
    }
    if (cardDetails.issuer_country?.name) {
      binHtml += `Country: ${cardDetails.issuer_country.name}<br>`;
    }
    if (cardDetails.last4) {
      binHtml += `Last 4: ${cardDetails.last4}<br>`;
    }

    binDetails.innerHTML = binHtml;
    document.getElementById('routing-info').style.display = 'block';
  }

  function displayRoutingInfo(routingDecision, cardDetails) {
    const routingInfo = document.getElementById('routing-info');
    const routingDetails = document.getElementById('routing-details');
    const binDetails = document.getElementById('bin-details');

    if (routingDecision) {
      let routingHtml = `<strong>Selected Processor:</strong> ${routingDecision.processor}<br>`;
      routingHtml += `<strong>Reason:</strong> ${routingDecision.reason}<br>`;

      if (routingDecision.confidence) {
        routingHtml += `<strong>Confidence:</strong> ${routingDecision.confidence}%<br>`;
      }

      routingDetails.innerHTML = routingHtml;
    }

    if (cardDetails) {
      displayCardInfo(cardDetails);
    }

    // Show the routing info section
    routingInfo.style.display = 'block';
  }
});
