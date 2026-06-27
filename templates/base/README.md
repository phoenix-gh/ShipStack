# {{projectName}}

Generated with ShipStack.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Add Modules

```bash
shipstack add database
shipstack add auth
shipstack add billing
shipstack add storage
shipstack add api-keys
shipstack add openapi
shipstack add api-rate-limit
pnpm install
```

The database module adds Cloudflare D1 and Drizzle. The auth module adds Better
Auth, sign-in/sign-up pages, and protected dashboard/account routes.
Billing adds Stripe checkout, portal, webhook handling, and entitlement helpers.
Storage adds R2-backed file APIs with metadata. API keys, OpenAPI, and API rate
limit recipes make the app usable by external clients without expanding the
base starter.

## Useful Commands

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm format
pnpm test
pnpm verify
pnpm build
pnpm preview
pnpm deploy:dry-run
pnpm deploy
pnpm verify:deployed https://<your-worker-url>
```

## API Routes

- `GET /api/health`
- `GET /api/v1/me`

`/api/v1/me` currently returns an anonymous placeholder until the auth module is installed.

## Generated Docs

- [Deployment](./docs/deployment.md)
- [Environment variables](./docs/env.md)
- [中文部署文档](./docs/zh-CN/deployment.md)
- [中文环境变量文档](./docs/zh-CN/env.md)

Installed modules add their own docs under `docs/` and `docs/zh-CN/`, and the
README is updated with links when a module is installed.

## Cloudflare

This template follows the official TanStack Start + Cloudflare Workers path with `@cloudflare/vite-plugin`, `wrangler`, and `@tanstack/react-start/server-entry`.

Use `pnpm deploy:dry-run` before logging in to Cloudflare when you want Wrangler
to compile and validate the Worker bundle without uploading it.
