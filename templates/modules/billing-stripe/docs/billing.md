# Billing

The billing module adds Stripe Checkout, Stripe customer portal sessions, a verified webhook endpoint, local subscription state, and a server-side entitlement helper.

## What It Adds

- `src/db/billing-schema.ts` for Stripe customers, subscriptions, and processed events
- `src/features/billing/server.ts` for checkout, portal, webhook, and entitlement behavior
- `src/routes/api.v1.billing.checkout.ts` for `POST /api/v1/billing/checkout`
- `src/routes/api.v1.billing.portal.ts` for `POST /api/v1/billing/portal`
- `src/routes/api.v1.billing.status.ts` for `GET /api/v1/billing/status`
- `src/routes/api.stripe.webhook.ts` for `POST /api/stripe/webhook`

## Environment

Copy `.dev.vars.example` to `.dev.vars`, then set:

```sh
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""
BILLING_SUCCESS_URL="http://localhost:5173/account?checkout=success"
BILLING_CANCEL_URL="http://localhost:5173/account?checkout=cancelled"
BILLING_PORTAL_RETURN_URL="http://localhost:5173/account"
```

Use Wrangler secrets for production values.

## Setup

Generate and apply the billing metadata migration:

```sh
pnpm db:generate
pnpm db:cf:migrate:local
```

For production:

```sh
pnpm db:cf:migrate:remote
pnpm wrangler secret put STRIPE_SECRET_KEY
pnpm wrangler secret put STRIPE_WEBHOOK_SECRET
pnpm wrangler secret put STRIPE_PRICE_ID
pnpm wrangler secret put BILLING_SUCCESS_URL
pnpm wrangler secret put BILLING_CANCEL_URL
pnpm wrangler secret put BILLING_PORTAL_RETURN_URL
```

Configure Stripe to send webhooks to:

```text
https://<your-worker-url>/api/stripe/webhook
```

Recommended events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Security Notes

- Treat Stripe webhooks as the source of truth for subscription state.
- Checkout and portal routes require a Better Auth session.
- Webhooks are verified with `STRIPE_WEBHOOK_SECRET`.
- Processed Stripe event IDs are recorded for idempotency.
- Paid feature checks should call `hasActiveSubscription()` or `getBillingStatus()`.
