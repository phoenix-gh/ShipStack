# Deploying To Cloudflare Workers

This app follows the official TanStack Start + Cloudflare Workers setup:

- `@cloudflare/vite-plugin`
- `@tailwindcss/vite`
- `wrangler`
- `@tanstack/react-start/server-entry`
- `compatibility_flags: ["nodejs_compat"]`

## Before You Deploy

Install dependencies and verify the app locally:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Log in to Cloudflare:

```bash
pnpm dlx wrangler login
```

## Base App Deploy

Run a local Wrangler deploy dry-run before using real credentials:

```bash
pnpm deploy:dry-run
```

This compiles the Worker and asks Wrangler to validate the deployment bundle
without uploading it to Cloudflare.

Deploy the Worker:

```bash
pnpm deploy
```

After deployment, Wrangler prints the Worker URL. Verify the deployed browser
and API health routes:

```bash
pnpm verify:deployed https://<your-worker-url>
```

The verification script checks:

- `/health` returns the health page
- `/api/health` returns a JSON envelope with `data.status` set to `ok`
- `/api/v1/me` returns the anonymous API envelope before auth is installed

You can also inspect the routes manually:

```bash
curl https://<your-worker-url>/health
curl https://<your-worker-url>/api/health
curl https://<your-worker-url>/api/v1/me
```

If a browser app, mobile shell, or desktop client will call the API from another
origin, configure the trusted origin allowlist before deploy:

```bash
pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
```

Leave the value empty until you have a concrete trusted client origin.

## GitHub Actions Deploy

The generated app includes two workflows:

- `.github/workflows/ci.yml` runs `pnpm verify` on pushes and pull requests.
- `.github/workflows/deploy.yml` is a manual `workflow_dispatch` deploy to
  Cloudflare Workers.

To use the deploy workflow, add this repository secret in GitHub:

```text
CLOUDFLARE_API_TOKEN
```

Use a token that can deploy the target Worker. Keep production runtime secrets
such as `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and
`SHIPSTACK_TRUSTED_ORIGINS` in Cloudflare Wrangler secrets, not in committed
files.

## If The D1 Database Module Is Installed

Create the database:

```bash
pnpm db:cf:create
```

Copy the returned `database_id` into `wrangler.jsonc` under the `DB` binding.

Generate and apply migrations:

```bash
pnpm db:generate
pnpm db:cf:migrate:local
pnpm db:cf:migrate:remote
```

Use `--local` migrations for local development and `--remote` migrations for
the deployed Cloudflare D1 database.

## If The Better Auth Module Is Installed

Local Worker secrets live in `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

Set production secrets with Wrangler before deploying:

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
pnpm wrangler secret put BETTER_AUTH_URL
```

Use your deployed Worker origin for `BETTER_AUTH_URL`, for example
`https://<your-worker-url>`.

After deployment, verify the auth path manually:

1. Visit `https://<your-worker-url>/sign-up`.
2. Create a test account.
3. Confirm `/dashboard` loads after sign up.
4. Sign out.
5. Sign back in at `/sign-in`.
6. Confirm `/dashboard` loads again.

## Generate Cloudflare Types

```bash
pnpm cf-typegen
```

## References

- [TanStack Start hosting on Cloudflare](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
