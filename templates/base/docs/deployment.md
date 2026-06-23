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
pnpm typecheck
pnpm test
pnpm build
```

Log in to Cloudflare:

```bash
pnpm dlx wrangler login
```

## Base App Deploy

Deploy the Worker:

```bash
pnpm deploy
```

After deployment, Wrangler prints the Worker URL. Check both browser and API
health routes:

```bash
curl https://<your-worker-url>/health
curl https://<your-worker-url>/api/health
```

The API health response should return a JSON envelope with `data.status` set to
`ok`.

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
