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
   curl https://<your-worker-url>/health
   curl https://<your-worker-url>/api/health
   curl https://<your-worker-url>/api/v1/me
   ```

   Expected results:

   - `/health` returns an HTML page containing `System health is ok.`
   - `/api/health` returns a JSON envelope with `data.status` equal to `ok`
   - `/api/v1/me` returns an anonymous envelope before auth is installed

6. If a browser app, mobile shell, or desktop client will call the API from
   another origin, set a comma-separated trusted origin allowlist.

   ```bash
   pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
   ```

   Leave the value empty until you have a concrete trusted client origin. CORS
   stays restrictive by default when this value is empty.

## Manual D1 And Auth Deploy Pass

Run these extra steps from a generated app when validating the database and auth
modules.

1. Install modules.

   ```bash
   node ../packages/cli/dist/cli.js add database
   node ../packages/cli/dist/cli.js add auth
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
   pnpm db:cf:migrate:local
   pnpm db:cf:migrate:remote
   ```

5. Set production auth secrets.

   ```bash
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put BETTER_AUTH_URL
   ```

   Use the deployed Worker origin for `BETTER_AUTH_URL`.

6. Deploy again.

   ```bash
   pnpm deploy
   ```

7. Verify auth manually in the browser.

   - visit `/sign-up`
   - create a test account
   - confirm `/dashboard` loads
   - sign out
   - sign back in at `/sign-in`
   - confirm `/dashboard` loads again

## Current Manual Status

Manual deployment has not been recorded for this repository yet. The generated
app includes the commands and route checks needed for a maintainer or
contributor with Cloudflare credentials to complete the pass.

## References

- [TanStack Start hosting on Cloudflare](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
