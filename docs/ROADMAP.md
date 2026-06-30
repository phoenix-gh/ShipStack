# ShipStack Roadmap

## Phase 0: Design Foundation

Status: done.

- define positioning
- define project architecture
- define module system
- define AI agent guide
- define MVP scope

## Phase 1: Minimal Runnable Starter

Goal: create a project that runs locally and deploys to Cloudflare Workers.

Deliverables:

- workspace setup
- base TanStack Start template
- Cloudflare Workers configuration
- Tailwind and minimal UI primitives
- health route
- API health route
- basic dashboard route
- `.env.example`
- local dev docs
- deploy docs
- smoke test

Exit criteria:

- fresh clone runs locally
- generated app can deploy to Cloudflare Workers
- CI proves the template builds

Current note: the generated-app smoke path, real Cloudflare deploy pass, remote
CI, npm provenance publish, and `v0.1.0-alpha.0` prerelease have passed.

## Phase 2: Database And Auth

Goal: make the starter useful for authenticated apps.

Deliverables:

- D1 binding
- Drizzle schema and migrations
- migration commands
- Better Auth setup
- email/password auth
- optional Google OAuth docs
- protected dashboard
- account settings
- `/api/v1/me` session-authenticated endpoint
- auth tests

Exit criteria:

- user can sign up, sign in, sign out
- protected route redirects anonymous users
- migration path works locally and remotely

## Phase 3: CLI MVP

Goal: turn the starter into a repeatable tool.

Deliverables:

- `create-shipstack-app`
- `shipstack doctor`
- `shipstack add database`
- `shipstack add auth`
- generated app `pnpm db:cf:create`
- idempotent file operations
- CLI tests

Exit criteria:

- user can create and validate a project from the CLI
- repeated commands do not corrupt the app
- errors explain the next action

Current note: CLI create, doctor, database, and auth module flows pass local smoke and unit tests. Dedicated Cloudflare management commands are post-MVP.

## Phase 4: Billing And Storage

Goal: complete the smallest SaaS loop.

Status: alpha published. Stripe billing and R2 storage are implemented,
locally verified, and included in `v0.1.0-alpha.0`.

Deliverables:

- Stripe checkout (done locally)
- Stripe webhook handler (done locally)
- subscription schema (done locally)
- billing portal (done locally)
- entitlement helper (done locally)
- R2 storage provider (done locally)
- file metadata table (done locally)
- upload and delete flows (done locally)
- billing and storage tests (done locally)

Exit criteria:

- authenticated user can start checkout
- webhook fixture updates subscription state
- paid feature check works server-side
- authenticated user can upload and manage a file

## Phase 5: Recipes

Goal: grow without bloating the starter.

Status: alpha published for the first recipes. API keys, OpenAPI generation,
and API rate limiting are implemented, locally verified, and included in
`v0.1.0-alpha.0`.

Initial recipes:

- API keys (done locally)
- OpenAPI generation (done locally)
- API rate limit (done locally)
- TypeScript API SDK
- admin user management
- audit log
- rate limit
- teams
- Postgres adapter
- Polar billing

Exit criteria:

- API keys recipe is installable from the CLI
- API keys recipe documents tradeoffs
- API keys recipe includes tests or smoke checks
- OpenAPI recipe is installable from the CLI
- OpenAPI recipe documents tradeoffs
- OpenAPI recipe includes tests or smoke checks
- API rate limit recipe is installable from the CLI
- API rate limit recipe documents local and production boundaries
- API rate limit recipe includes tests or smoke checks

## Phase 6: Ecosystem

Goal: become a trusted open-source base for Cloudflare-first SaaS apps.

Status: started. Public GitHub repository, npm packages, npm provenance, and an
alpha GitHub prerelease exist.

Deliverables:

- docs site
- example apps
- contribution guide
- module authoring guide
- community showcase
- release automation (alpha path done)
- update guide

Exit criteria:

- external users contribute recipes
- real launched apps are listed
- releases include migration notes

## Stable v0.1.0 Focus

The alpha release proves the package, CI, deploy, and release machinery. The
stable `v0.1.0` release should wait for first-run feedback from at least one
fresh install using the published packages:

- `pnpm create shipstack-app my-app`
- add database, auth, billing, storage, API keys, OpenAPI, and API rate limit
- run generated app lint, tests, typecheck, build, and local D1 migration
- verify the Cloudflare deploy checklist remains accurate
- record any migration or breaking notes since `v0.1.0-alpha.0`
