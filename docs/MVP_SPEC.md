# MVP Specification

This document defines the first useful version of ShipStack.

## MVP Promise

A developer can create a TanStack Start app, run it locally, authenticate a user, access a protected dashboard, migrate a D1 database, and deploy to Cloudflare Workers without guessing the project structure.

## In Scope

### Base App

- TanStack Start app
- TanStack Router file routing
- Cloudflare Workers runtime target
- Tailwind CSS
- minimal component primitives
- home route
- health route
- health API route
- dashboard shell
- TypeScript strict mode
- lint and format commands

### Database

- Cloudflare D1 binding
- Drizzle config
- schema entrypoint
- migrations directory
- migration scripts
- local development database path
- database smoke test

### Auth

- Better Auth setup
- email/password sign up
- email/password sign in
- sign out
- current session helper
- protected dashboard route
- account settings route
- auth e2e test

### API Foundation

- `/api/health`
- `/api/v1/me` session-authenticated example
- shared JSON response helper
- shared JSON error helper
- request ID helper
- API smoke test

### Deployment

- `wrangler.jsonc`
- Cloudflare Workers build command
- local dev command
- deploy command
- GitHub Actions workflow
- deployment documentation

### Environment

- `.env.example`
- `.dev.vars.example`
- environment variable documentation
- clear distinction between local vars, public vars, build-time vars, and runtime secrets

### AI Agent Support

- generated `AGENTS.md`
- documented feature layout
- extension rules for routes, db schema, auth, and Cloudflare bindings

## Out Of Scope

- billing
- R2 storage
- API keys
- OpenAPI generation
- public API rate limiting
- generated SDKs
- admin panel
- team accounts
- landing page builder
- newsletter
- blog CMS
- AI demos
- multi-provider database support
- multi-provider deployment support

These are important but should arrive after the base path is reliable.

## User Journey

Target flow:

```bash
pnpm create shipstack my-app
cd my-app
pnpm install
shipstack doctor
shipstack add database
shipstack add auth
pnpm db:generate
pnpm db:cf:migrate:local
pnpm dev
pnpm lint
pnpm test
pnpm deploy
```

The exact commands can change during implementation, but the first-run experience should remain this short.

## Acceptance Criteria

The MVP is done when all of these pass from a fresh clone or generated app:

- dependencies install successfully
- app starts locally
- home route renders
- health route returns success
- health API returns success
- authenticated `/api/v1/me` returns the current user
- D1 migration runs locally
- user can sign up
- user can sign in
- anonymous user cannot access dashboard
- authenticated user can access dashboard
- app builds for Cloudflare Workers
- deployment docs are complete enough to follow manually
- generated `AGENTS.md` exists and matches the project layout

## Manual Verification Checklist

Before calling the MVP complete:

1. Create a fresh app.
2. Install dependencies.
3. Copy example env files.
4. Run local migration.
5. Start the dev server.
6. Create an account.
7. Sign out.
8. Sign back in.
9. Visit the dashboard.
10. Run tests.
11. Build for Workers.
12. Deploy to a real Cloudflare account or document why deploy was not run.

## First Release Tag

Use `v0.1.0` for the first MVP release.

The release notes should include:

- supported Node version
- supported package manager
- required Cloudflare setup
- known limitations
- next planned modules
