# Reproduction Prompts

How to reproduce this project from the Stripe accept-a-payment sample using Claude Code skills.

## Prerequisites (before prompts)

1. Fork [stripe-samples/accept-a-payment](https://github.com/stripe-samples/accept-a-payment) and clone it
2. Clone [thegreysky/vibe-orchestration-skills](https://github.com/thegreysky/vibe-orchestration-skills) and copy these directories into the fork root:
   - `.claude/skills/` (the generate-mapping, generate-sdk, and build-demo skills)
   - `schema/` (the PSP mapping JSON schema)
   - `mappings/` (reference mapping for adyen)
3. Commit the additions and push

## Prompt 1: Generate PSP Mappings

```
/generate-mapping-for-psp stripe
```

Then:

```
/generate-mapping-for-psp checkout
```

This researches each PSP's API docs and produces `mappings/stripe.json` and `mappings/checkout.json` with field mappings, status codes, error codes, source type transforms (including Basis Theory proxy expressions), and 3DS handling.

## Prompt 2: Generate the Unified SDK

```
/generate-sdk typescript stripe,checkout ./generated-sdk
```

This reads the mapping files and SDK templates to produce a TypeScript SDK with a unified PaymentClient, StripeProvider, and CheckoutProvider. Each provider handles all five source types, routes BT token requests through the BT proxy, and normalizes responses and errors to a common interface.

## Prompt 3: Integrate into the Stripe Sample App

```
Modify custom-payment-flow to be a multi-processor payment routing demo:

Frontend (custom-payment-flow/client/html/):
- Replace Stripe Elements with Basis Theory Web Elements for card tokenization
- After tokenizing, read the card details from the token response (token.card has brand, funding, segment, issuer, issuer_country) and send them to the server along with the token ID
- Display the routing decision and card details in the UI after payment

Backend (custom-payment-flow/server/node/):
- Import and use the generated unified-payment-sdk from ../../../generated-sdk for all payment processing — do not call Stripe or Checkout.com APIs directly
- Use the card details from the token (brand, funding, segment, issuer_country) to decide which processor to route to
- Routing rules: debit cards, international cards, and commercial cards go to Checkout.com. American Express and US consumer credit cards go to Stripe.
- Build a TransactionRequest with source type basis_theory_token and authorize through paymentClient.authorize(processorName, request)
- Keep the existing Stripe tax calculation code (calculateTax flag and calculate_tax function)
- Serve card.html as the default page
```

## Environment Variables

Create `custom-payment-flow/server/node/.env`:

```
BT_PUBLIC_KEY=your_bt_public_key
BT_PRIVATE_API_KEY=your_bt_private_key
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
CHECKOUT_SECRET_KEY=sk_test_...
CHECKOUT_PROCESSING_CHANNEL_ID=pc_...
STATIC_DIR=../../client/html
```

## Run

```
cd custom-payment-flow/server/node
npm install
node server.js
# http://localhost:4242
```
