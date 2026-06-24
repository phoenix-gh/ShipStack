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
```

The database module adds Cloudflare D1 and Drizzle. The auth module adds Better
Auth, sign-in/sign-up pages, and protected dashboard/account routes.

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

## Docs

- [Deployment](./docs/deployment.md)
- [Environment variables](./docs/env.md)

## Cloudflare

This template follows the official TanStack Start + Cloudflare Workers path with `@cloudflare/vite-plugin`, `wrangler`, and `@tanstack/react-start/server-entry`.

Use `pnpm deploy:dry-run` before logging in to Cloudflare when you want Wrangler
to compile and validate the Worker bundle without uploading it.
