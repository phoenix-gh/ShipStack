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

Current note: the local generated-app build and smoke path pass. A real Cloudflare deploy pass still needs account credentials.

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

- `create-shipstack`
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

Deliverables:

- Stripe checkout
- Stripe webhook handler
- subscription schema
- billing portal
- entitlement helper
- R2 storage provider
- file metadata table
- upload and delete flows
- billing and storage tests

Exit criteria:

- authenticated user can start checkout
- webhook fixture updates subscription state
- paid feature check works server-side
- authenticated user can upload and manage a file

## Phase 5: Recipes

Goal: grow without bloating the starter.

Initial recipes:

- API keys
- OpenAPI generation
- API rate limit
- TypeScript API SDK
- admin user management
- audit log
- rate limit
- teams
- Postgres adapter
- Polar billing

Exit criteria:

- recipes are installable or copyable
- each recipe documents tradeoffs
- recipes include tests or smoke checks

## Phase 6: Ecosystem

Goal: become a trusted open-source base for Cloudflare-first SaaS apps.

Deliverables:

- docs site
- example apps
- contribution guide
- module authoring guide
- community showcase
- release automation
- update guide

Exit criteria:

- external users contribute recipes
- real launched apps are listed
- releases include migration notes
