# ShipStack Project Design

## 1. Product Positioning

ShipStack is an open-source, modular, Cloudflare-first SaaS engineering stack for TanStack Start.

It should feel less like a static template and more like a reliable project creation and maintenance system:

```bash
pnpm create shipstack my-app
cd my-app
pnpm shipstack doctor
pnpm shipstack add auth
pnpm shipstack add billing --provider stripe
pnpm shipstack add storage --provider r2
pnpm shipstack deploy
```

The first version does not need all commands implemented, but the architecture should be shaped around this user experience.

## 2. Target Users

Primary users:

- indie hackers building small SaaS products
- developers who prefer Cloudflare over Vercel for cost and deployment control
- builders who want TanStack Start instead of Next.js
- AI-assisted developers using Codex, Cursor, Claude Code, or similar tools
- small teams that want a transparent open-source base instead of a private paid boilerplate

Secondary users:

- agencies that repeatedly start SaaS projects
- open-source maintainers building hosted services
- developers learning Cloudflare-native full-stack architecture

## 3. Problems To Solve

ShipStack solves repeated SaaS infrastructure work:

- create a full-stack TanStack Start app with a sane structure
- configure Cloudflare Workers deployment
- set up D1 and Drizzle migrations
- implement authentication with protected routes
- expose typed API routes for mobile apps, desktop apps, CLIs, and third-party integrations
- wire billing checkout, webhooks, and subscription state
- upload files to R2 and store file metadata
- create dashboard, settings, billing, API key, and basic admin surfaces
- reduce environment-variable confusion
- make the generated project friendly to AI coding agents
- provide tests that prove the starter still works after dependency changes

## 4. Non-Goals

ShipStack should not become a giant all-in-one product template in the first release.

Do not prioritize these in MVP:

- marketing-heavy landing page systems
- theme marketplace
- AI demos
- newsletter integrations
- blog CMS
- complex multi-tenant organizations
- advanced RBAC
- every payment provider
- every database provider
- visual page builder
- no-code admin customization

These can become recipes after the core path is reliable.

## 5. Design Principles

### Minimal First Run

A new project should run locally with the smallest possible configuration. Optional services should be introduced only when their module is installed.

### Cloudflare First, Not Cloudflare Only

The default path should deeply support Workers, D1, R2, and Wrangler. However, provider-specific behavior should live behind small interfaces so future adapters are possible.

### Modules Over Monolith

Features should be addable and removable as modules. A user should not need billing, storage, newsletter, or AI code if they only want auth and a dashboard.

### Verification Over Claims

Every core module should ship with tests or smoke checks. The project should prove auth, migrations, webhooks, upload flows, and deployment configuration work.

### AI-Friendly By Default

Generated projects should include clear file ownership, extension rules, module conventions, and examples. AI agents should be able to add features without inventing new architecture.

### API-Ready, Not API-Heavy

ShipStack should work as the backend for web apps, mobile apps, desktop apps, CLIs, and partner integrations. The default API surface should be small, versioned, documented, and protected. Advanced API platform features should be modules or recipes, not mandatory base-app complexity.

### Boring Production Choices

Prefer stable patterns over clever abstractions. The generated app should be easy to debug at 2 a.m.

## 6. Repository Shape

The ShipStack source repository should eventually contain both the generator and the starter templates.

```text
.
├── apps/
│   ├── docs/                    # Documentation site
│   └── playground/              # Generated app used for manual testing
├── packages/
│   ├── create-shipstack/        # create command entrypoint
│   ├── cli/                     # shipstack CLI commands
│   ├── core/                    # shared module registry and utilities
│   ├── config/                  # shared lint, tsconfig, test config
│   └── testing/                 # test helpers for generated projects
├── templates/
│   ├── base/                    # minimal TanStack Start + Cloudflare app
│   └── modules/
│       ├── auth/
│       ├── database/
│       ├── billing-stripe/
│       ├── storage-r2/
│       ├── api-keys/
│       └── admin/
├── recipes/
│   ├── teams/
│   ├── audit-log/
│   ├── rate-limit/
│   ├── postgres/
│   └── polar-billing/
├── docs/
├── AGENTS.md
├── package.json
└── pnpm-workspace.yaml
```

The generated user application should be clean and conventional:

```text
my-app/
├── src/
│   ├── components/
│   ├── config/
│   ├── db/
│   ├── features/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── dashboard/
│   │   ├── storage/
│   │   └── users/
│   ├── lib/
│   ├── routes/
│   ├── routeTree.gen.ts
│   └── styles/
├── drizzle/
│   └── migrations/
├── public/
├── tests/
│   ├── e2e/
│   └── integration/
├── wrangler.jsonc
├── drizzle.config.ts
├── vite.config.ts
├── package.json
├── .env.example
└── AGENTS.md
```

## 7. Module System

A module is a unit of generated functionality. Each module should declare:

- files to create or patch
- package dependencies
- environment variables
- Wrangler bindings
- database schema additions
- commands to run after install
- tests to add
- documentation snippets
- conflicts with other modules

Conceptual module manifest:

```ts
export interface ShipStackModule {
  id: string;
  name: string;
  description: string;
  dependencies?: string[];
  packages?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  env?: EnvVarSpec[];
  wrangler?: WranglerBindingSpec[];
  files?: FileOperation[];
  patches?: PatchOperation[];
  migrations?: MigrationSpec[];
  tests?: TestSpec[];
  docs?: DocSpec[];
}
```

The first implementation can be simpler, but this is the direction.

## 8. Core Modules

### Base

Creates the minimal app:

- TanStack Start
- TanStack Router
- Cloudflare Workers adapter
- Tailwind CSS
- minimal UI primitives
- base layout
- health route
- environment loading
- Wrangler configuration
- GitHub Actions deploy workflow

### Database

Adds D1 and Drizzle:

- D1 binding
- Drizzle client
- schema directory
- migrations directory
- local and remote migration scripts
- seed command
- database smoke test

### Auth

Adds Better Auth:

- email/password sign up and sign in
- Google OAuth optional configuration
- session handling
- auth client and server helpers
- protected route guard
- dashboard route
- account settings page
- auth e2e tests

### API

Adds an external API foundation:

- `/api/health` route
- `/api/v1/*` route convention
- JSON response and error envelope helpers
- session-authenticated API example
- API-key-authenticated API example after the API Keys module is installed
- CORS configuration for trusted app clients
- request ID helper
- API smoke tests

### Billing Stripe

Adds Stripe billing:

- product and price config
- checkout session creation
- customer portal
- webhook route
- subscription table
- subscription state sync
- billing settings page
- webhook fixture tests

### Storage R2

Adds R2 uploads:

- R2 binding
- storage provider interface
- upload route
- signed download or public access strategy
- user file metadata table
- upload UI
- file access tests

### API Keys

Adds API key management:

- key table
- key creation and revocation
- hashed storage
- scoped keys
- dashboard UI
- middleware/helper for API auth
- API usage examples

### Admin

Adds minimal admin:

- admin route group
- user list
- user detail
- subscription visibility
- role flag
- protected admin guard

## 9. CLI Design

The CLI is the main differentiator.

Initial commands:

```bash
shipstack doctor
shipstack add <module>
shipstack db create
shipstack db migrate
shipstack db seed
shipstack cf init
shipstack cf create-r2
shipstack secrets sync
shipstack deploy
```

MVP commands:

- `shipstack doctor`: check Node, package manager, Wrangler, Cloudflare auth, env files, D1 binding, R2 binding
- `shipstack add auth`: install auth module
- `shipstack add database`: install database module
- generated app `pnpm db:cf:create`: create a D1 database through Wrangler
- generated app migration scripts: run local or remote migrations

Post-MVP commands:

- `shipstack add api`: install external API conventions and helpers when the API module becomes separate from the base starter
- `shipstack cf create-d1`: create D1 database and patch Wrangler config
- `shipstack db migrate`: run local or remote migrations

The CLI should be idempotent where possible. Running a command twice should explain what already exists instead of duplicating files.

## 10. Environment Strategy

Environment confusion is one of the core pains. ShipStack should separate:

- public browser variables
- build-time variables
- runtime Worker secrets
- local development variables
- provider resource IDs

Generated files:

- `.env.example`
- `.env.local.example`
- `.dev.vars.example`
- `docs/env.md`

Rules:

- never commit real secrets
- keep public variables explicitly prefixed
- use Wrangler secrets for production runtime secrets
- document which variables belong in GitHub Actions
- generate env docs from module manifests when possible

## 11. Database Strategy

D1 is the default database.

Rules:

- Drizzle schema is the source of truth
- generated migrations are committed
- local D1 and remote D1 commands are separate
- user data tables live near feature modules but export through a central schema index
- cross-feature relations should be explicit and documented

Future adapter path:

- Postgres through Neon or Supabase
- Turso as an alternative SQLite path
- test modules against adapter contracts

## 12. Auth Strategy

Better Auth is the first auth provider.

Rules:

- auth code lives in `src/features/auth`
- route guards should be small and reusable
- server-side session access should have one canonical helper
- client-side auth state should not duplicate server truth
- generated UI should support email/password by default
- OAuth should be optional and clearly documented

## 13. Billing Strategy

Stripe is the first billing provider.

Rules:

- billing state is stored locally after webhook confirmation
- never trust client-side subscription state
- all webhook handlers must be idempotent
- product and price IDs belong in config/env
- checkout creation should check the authenticated user
- paid feature checks should call a server-side entitlement helper

Future provider path:

- Polar
- Creem
- Lemon Squeezy

## 14. Storage Strategy

R2 is the first storage provider.

Rules:

- file metadata is stored in the database
- user ownership is checked before access
- generated examples should avoid public buckets by default
- upload size limits should be explicit
- delete should remove both metadata and object when possible

Future provider path:

- S3-compatible storage
- local filesystem for development-only mode

## 15. Testing Strategy

Testing is part of the product.

Core checks:

- unit tests for provider interfaces and helpers
- integration tests for auth, database, API responses, billing webhooks, storage
- Playwright tests for sign in, dashboard access, billing page, file upload
- CLI tests for idempotent module installation
- generated project smoke test in CI

The repository should include a playground generated from the current template. CI should regenerate it and run smoke tests to catch broken templates.

## 16. Documentation Strategy

Docs should be task-oriented:

- quickstart
- local development
- deployment to Cloudflare
- environment variables
- database migrations
- authentication
- billing
- storage
- module authoring
- recipes
- AI agent guide

Every module should own its documentation fragment. The final docs can be assembled from the module registry.

## 17. Open Source Strategy

The open-source project should offer enough value to be trusted and used without payment:

- base app
- database
- auth
- Stripe billing
- R2 storage
- CLI setup
- tests
- core recipes

Potential commercial extensions later:

- hosted setup dashboard
- managed updates
- advanced team/multi-tenant recipe
- admin pro module
- audit log module
- support contracts
- project migration services

Avoid monetization until the project has real users and examples.

## 18. MVP Definition

MVP is complete when a user can:

1. create a new project
2. run it locally
3. create and migrate a local D1 database
4. sign up and sign in
5. access a protected dashboard
6. call a documented health API endpoint
7. deploy to Cloudflare Workers
8. run a documented smoke test

Stretch MVP:

1. create a Stripe checkout session
2. receive a local webhook fixture
3. sync subscription state
4. upload a file to R2
5. create and revoke API keys

## 20. API Service Design

ShipStack should be usable as an API backend for:

- mobile apps
- desktop apps
- browser extensions
- CLI tools
- partner integrations
- another frontend that is not served by the same TanStack Start app

The base app should include a small API foundation, not a large API management platform.

### API Route Conventions

Use versioned API routes:

```text
/api/health
/api/v1/me
/api/v1/files
/api/v1/billing/subscription
```

Rules:

- public operational checks use `/api/health`
- user-facing API routes use `/api/v1`
- route handlers should be thin
- request validation belongs near the feature module
- business logic belongs in `src/features/<feature>`
- shared API helpers live in `src/features/api` or `src/lib/api`

### Response Format

Use a consistent JSON envelope for external API responses:

```json
{
  "data": {},
  "error": null,
  "requestId": "req_..."
}
```

For failures:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "requestId": "req_..."
}
```

Do not leak internal exception details to API clients.

### Authentication Modes

Support two API authentication modes:

- session auth for first-party web or app clients that can use cookies
- API key auth for CLIs, server-to-server calls, and third-party integrations

The API keys recipe adds bearer authentication for CLIs, server-to-server calls, and third-party integrations.

Do not treat API keys as mobile-user login tokens. Native app user authentication should use a dedicated session or bearer-token strategy with clear refresh, revocation, and storage rules.

### App Client Support

For mobile or desktop apps, ShipStack should support:

- CORS allowlist for trusted clients
- bearer-token authentication where cookies are not suitable
- stable API error codes
- versioned routes
- optional OpenAPI generation through the OpenAPI recipe

### Security Rules

- never trust client-side user IDs
- derive user identity from the session or API key
- validate request bodies
- apply ownership checks in feature services
- keep CORS restrictive by default
- add rate limiting as a recipe before encouraging public APIs

### Future API Modules

Potential modules:

- `api-keys`
- `api-openapi`
- `api-rate-limit`
- `api-usage`
- `api-sdk-typescript`
- `api-webhooks`

## 19. Success Metrics

Early signals:

- users can finish quickstart in under 15 minutes
- generated project passes CI from a fresh clone
- GitHub stars from Cloudflare/TanStack communities
- issues are about feature requests more than broken setup
- at least three real projects launch from ShipStack

Longer-term signals:

- external module or recipe contributions
- community examples
- recurring maintainers
- paid support or sponsorship interest
