# Deployment Verification

This is the maintainer checklist for proving a generated ShipStack app can be
deployed to Cloudflare Workers.

## What Can Be Verified Locally

The smoke suite already verifies these deployment-adjacent checks:

- a fresh generated app installs dependencies
- the app starts locally
- `/` renders
- `/health` renders
- `/api/health` returns a success envelope
- D1 migrations apply locally
- auth sign up, sign out, sign in, and protected dashboard access work locally
- generated apps build for Cloudflare Workers
- the base generated app passes `wrangler deploy --dry-run`
- generated app CI and manual deploy workflows exist

Run the full suite:

```bash
pnpm smoke
```

Maintainers can also run an optional temporary Cloudflare deploy smoke without a
logged-in account:

```bash
pnpm smoke:temporary-deploy
```

This verifies a real upload to Cloudflare's temporary account service and checks
the deployed `/health`, `/api/health`, and `/api/v1/me` routes. It is external
network evidence, not a replacement for the real-account checklist below.

## Manual Cloudflare Deploy Pass

Use a real Cloudflare account for this checklist.

1. Create a fresh generated app.

   ```bash
   pnpm build
   node packages/create-shipstack/dist/cli.js deploy-check-app
   cd deploy-check-app
   ```

2. Install dependencies and verify the base app.

   ```bash
   pnpm install
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm deploy:dry-run
   ```

3. Log in to Cloudflare.

   ```bash
   pnpm dlx wrangler login
   ```

4. Deploy the base app.

   ```bash
   pnpm deploy
   ```

5. Check the deployed routes.

   ```bash
   pnpm verify:deployed https://<your-worker-url>
   ```

   Expected results:

   - `/health` returns an HTML page containing `System health is ok.`
   - `/api/health` returns a JSON envelope with `data.status` equal to `ok`
   - `/api/v1/me` returns an anonymous envelope before auth is installed

   You can also inspect the same routes manually with `curl`:

   ```bash
   curl https://<your-worker-url>/health
   curl https://<your-worker-url>/api/health
   curl https://<your-worker-url>/api/v1/me
   ```

6. If a browser app, mobile shell, or desktop client will call the API from
   another origin, set a comma-separated trusted origin allowlist.

   ```bash
   pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
   ```

   Leave the value empty until you have a concrete trusted client origin. CORS
   stays restrictive by default when this value is empty.

## Manual D1, Auth, Billing, Storage, API Keys, OpenAPI, And API Rate Limit Deploy Pass

Run these extra steps from a generated app when validating the database, auth,
billing, storage, API keys, OpenAPI, and API rate limit modules.

1. Install modules.

   ```bash
   node ../packages/cli/dist/cli.js add database
   node ../packages/cli/dist/cli.js add auth
   node ../packages/cli/dist/cli.js add billing
   node ../packages/cli/dist/cli.js add storage
   node ../packages/cli/dist/cli.js add api-keys
   node ../packages/cli/dist/cli.js add openapi
   node ../packages/cli/dist/cli.js add api-rate-limit
   pnpm install
   ```

   Adjust the CLI path if the generated app is outside the repository.

2. Create the D1 database.

   ```bash
   pnpm db:cf:create
   ```

3. Copy the returned `database_id` into `wrangler.jsonc` under the `DB` binding.

4. Generate and apply migrations.

   ```bash
   pnpm db:generate
   pnpm openapi:generate
   pnpm db:cf:migrate:local
   pnpm db:cf:migrate:remote
   ```

5. Set production auth secrets.

   ```bash
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put BETTER_AUTH_URL
   ```

   Use the deployed Worker origin for `BETTER_AUTH_URL`.

6. Set production billing secrets.

   ```bash
   pnpm wrangler secret put STRIPE_SECRET_KEY
   pnpm wrangler secret put STRIPE_WEBHOOK_SECRET
   pnpm wrangler secret put STRIPE_PRICE_ID
   pnpm wrangler secret put BILLING_SUCCESS_URL
   pnpm wrangler secret put BILLING_CANCEL_URL
   pnpm wrangler secret put BILLING_PORTAL_RETURN_URL
   ```

   Configure Stripe to send `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`, and
   `customer.subscription.deleted` events to `/api/stripe/webhook`.

7. Create the R2 bucket.

   ```bash
   wrangler r2 bucket create shipstack-files
   ```

8. Confirm `wrangler.jsonc` contains a `FILES` R2 binding.

9. Deploy again.

   ```bash
   pnpm deploy
   ```

10. Verify auth manually in the browser.

- visit `/sign-up`
- create a test account
- confirm `/dashboard` loads
- sign out
- sign back in at `/sign-in`
- confirm `/dashboard` loads again

11. Verify billing manually with Stripe test mode.

- create a Checkout session from `POST /api/v1/billing/checkout`
- complete Checkout with a Stripe test card
- confirm `/api/v1/billing/status` reports an active subscription
- open `POST /api/v1/billing/portal` and confirm Stripe returns a portal URL

## Current Manual Status

Temporary Cloudflare deployment has passed from this workspace before, but it
has not been rerun for the current release candidate after the latest recipe
changes. The latest local release verification on 2026-06-28 passed
`pnpm verify:release`, and the latest `pnpm smoke` run on 2026-06-28 passed,
including recipe installer next-step output checks and generated app
`wrangler deploy --dry-run`.

The latest full release audit on 2026-06-28 passed local checks and stopped on
five external blockers: pending release evidence for real Cloudflare deploy,
remote GitHub Actions, and remote npm publish workflow dry-run, plus no
configured Git remote and unauthenticated Wrangler. Real-account deployment has
not been recorded for this repository yet. The generated app includes the
commands and route checks needed for a maintainer or contributor with
Cloudflare credentials to complete the pass.

## References

- [TanStack Start hosting on Cloudflare](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
