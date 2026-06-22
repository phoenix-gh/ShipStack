# ShipStack Agent Guide

This guide tells AI coding agents how to work in this repository and in generated ShipStack apps.

## Project Mission

ShipStack is an open-source, modular, Cloudflare-first SaaS stack for TanStack Start.

Prefer changes that help users create, understand, verify, and deploy a real SaaS foundation. Avoid turning the project into a broad demo gallery.

## Current Phase

The repository is in design stage. The immediate goal is to move toward a minimal runnable starter:

- TanStack Start
- Cloudflare Workers
- D1 and Drizzle
- Better Auth
- API routes for app and integration clients
- protected dashboard
- clear environment handling
- deployment docs
- smoke tests

## Engineering Rules

- Keep the base starter minimal.
- Add features as modules or recipes when possible.
- Prefer explicit provider boundaries over hidden global coupling.
- Avoid introducing a new abstraction unless it removes real duplication or protects a provider boundary.
- Do not add large unrelated UI systems, theme frameworks, AI demos, or marketing pages to the MVP.
- Keep generated code easy for humans to inspect and debug.
- Every significant behavior change should include a test, smoke check, or documented manual verification path.

## Repository Conventions

Planned source repository layout:

```text
apps/
packages/
templates/
recipes/
docs/
AGENTS.md
```

Use `docs/PROJECT_DESIGN.md` as the source of truth for product and architecture direction.

Use `docs/ROADMAP.md` to decide what belongs in the current phase.

Use `docs/MVP_SPEC.md` to decide whether the first release is complete.

Use `docs/MODULE_MANIFEST.md` when adding or changing module installation behavior.

Use `docs/DECISIONS.md` to understand accepted tradeoffs before changing architecture.

Use `docs/LEGAL_BOUNDARIES.md` before implementing features that overlap with paid or private boilerplate products.

## Generated App Conventions

Generated apps should use this broad shape:

```text
src/
  components/
  config/
  db/
  features/
  features/api/
  lib/
  routes/
  routeTree.gen.ts
  styles/
drizzle/
public/
tests/
wrangler.jsonc
drizzle.config.ts
vite.config.ts
.env.example
AGENTS.md
```

Feature code belongs under `src/features/<feature>`.

Shared primitives belong under `src/lib` or `src/components`.

Route files should stay thin. Put business logic in feature modules.

External API helpers should live in `src/features/api` or `src/lib/api`.

## Module Rules

When adding a module, define or update:

- files created by the module
- package dependencies
- environment variables
- Wrangler bindings
- database schema or migrations
- setup commands
- tests or smoke checks
- documentation

Modules should be idempotent. Installing a module twice should not duplicate routes, env vars, bindings, or schema exports.

## Cloudflare Rules

- Cloudflare Workers is the default runtime.
- D1 is the default database.
- R2 is the default object storage.
- Wrangler configuration should be patched carefully and predictably.
- Keep build-time env, runtime secrets, local `.dev.vars`, and public browser env documented separately.
- Never commit real secrets.

## Database Rules

- Drizzle schema is the source of truth.
- Commit generated migrations.
- Keep local and remote migration commands distinct.
- Store user-owned resource metadata in the database.
- Prefer explicit relations and readable table names.

## Auth Rules

- Better Auth is the first auth provider.
- Keep one canonical server-side session helper.
- Do not trust client-side auth state for protected server behavior.
- Protected routes should use a shared guard pattern.
- OAuth should be optional, not required for local first run.

## API Rules

- ShipStack should be usable as the backend for web, mobile, desktop, CLI, and partner clients.
- Use versioned external API routes under `/api/v1`.
- Keep `/api/health` available as a lightweight operational check.
- Use consistent JSON response and error envelopes.
- Include a request ID in API responses when practical.
- Do not leak internal exception details to clients.
- Derive user identity from the session or API key, never from a client-provided user ID.
- Keep CORS restrictive by default and document trusted client configuration.
- Put validation and business logic in feature modules, not directly in route files.
- Use API keys for server-to-server, CLI, and third-party integrations once the API Keys module is installed.
- Do not use API keys as mobile-user login tokens; native app user auth needs an explicit session or bearer-token design.

## Billing Rules

- Stripe is the first billing provider.
- Billing state must be confirmed by webhooks.
- Webhook handlers must be idempotent.
- Paid feature access should call a server-side entitlement helper.
- Product and price IDs belong in config or env, not inline in route logic.

## Storage Rules

- R2 is the first storage provider.
- Store file metadata in the database.
- Check ownership before read, update, or delete.
- Avoid public buckets by default.
- Keep upload size limits explicit.

## UI Rules

- Build the actual app surface first, not a marketing landing page.
- Dashboard UI should be quiet, dense, and practical.
- Prefer existing component conventions once the starter exists.
- Do not add decorative-heavy layouts to operational pages.

## Documentation Rules

- Keep docs task-oriented.
- Explain setup steps through commands and expected results.
- Document environment variables near the module that introduces them.
- Update docs when behavior or commands change.

## Testing Rules

Prioritize tests for:

- generated project build
- CLI idempotency
- D1 migrations
- auth sign in and protected routes
- API health and authenticated API routes
- Stripe webhook fixtures
- R2 upload flows

If a test cannot be added yet, include a short manual verification path in the relevant docs or final report.

## Things To Avoid

- Do not copy a private boilerplate's code or structure.
- Do not copy paid boilerplate templates, proprietary assets, private docs, marketing copy, prompts, or implementation details.
- Do not imply affiliation with TanStarter, MkFast, or another paid starter.
- Do not add broad feature sets before the MVP path works.
- Do not hide provider-specific assumptions in generic names.
- Do not add secrets to committed files.
- Do not make generated apps depend on optional services before their modules are installed.
- Do not change architecture decisions without updating `docs/DECISIONS.md`.
