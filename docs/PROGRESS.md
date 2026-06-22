# Progress

This file is the working progress board for ShipStack. Update it whenever a deliverable changes status.

## Current Snapshot

Status: building toward `v0.1.0` MVP.

Last verified:

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke`

Latest milestone commit:

- `64e4d3c test: add generated app smoke tests`

## Phase Progress

| Phase                             | Status      | Notes                                                                                                                                     |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | Done        | Product direction, MVP scope, module model, agent guide, and legal boundaries exist.                                                      |
| Phase 1: Minimal Runnable Starter | Mostly done | Base TanStack Start + Cloudflare Workers template builds and passes generated-app smoke tests. CI and final UI primitive decision remain. |
| Phase 2: Database And Auth        | In progress | D1, Drizzle, Better Auth, auth pages, session API, and account route exist. Protected server behavior and auth e2e tests remain.          |
| Phase 3: CLI MVP                  | In progress | `create`, `doctor`, `add database`, and `add auth` exist. CLI unit tests and stronger doctor checks remain.                               |
| Phase 4: Billing And Storage      | Not started | Stripe and R2 are planned after the base path is reliable.                                                                                |
| Phase 5: Recipes                  | Not started | Recipes wait until MVP modules are stable.                                                                                                |
| Phase 6: Ecosystem                | Not started | Docs site, contribution guide, releases, and examples come later.                                                                         |

## MVP Acceptance Progress

| Acceptance criterion                                   | Status        | Verification                                                        |
| ------------------------------------------------------ | ------------- | ------------------------------------------------------------------- |
| Dependencies install successfully                      | Passing       | `pnpm smoke` installs generated apps.                               |
| App starts locally                                     | Not automated | Needs runtime smoke or manual dev-server check.                     |
| Home route renders                                     | Not automated | Needs runtime smoke or browser check.                               |
| Health route returns success                           | Not automated | Route exists, but runtime check remains.                            |
| Health API returns success                             | Not automated | Route exists, but runtime API check remains.                        |
| Authenticated `/api/v1/me` returns current user        | Partial       | Route exists after auth module; authenticated runtime test remains. |
| D1 migration runs locally                              | Not automated | Migration commands exist; local migration smoke remains.            |
| User can sign up                                       | Partial       | Auth page and Better Auth route exist; e2e test remains.            |
| User can sign in                                       | Partial       | Auth page and Better Auth route exist; e2e test remains.            |
| Anonymous user cannot access dashboard                 | Partial       | Dashboard is session-aware; server-side guard remains.              |
| Authenticated user can access dashboard                | Partial       | Dashboard UI supports session state; e2e test remains.              |
| App builds for Cloudflare Workers                      | Passing       | `pnpm smoke` runs generated app builds.                             |
| Deployment docs are complete enough to follow manually | Partial       | Base docs exist; full manual deploy pass remains.                   |
| Generated `AGENTS.md` exists and matches layout        | Passing       | Base template includes `AGENTS.md`.                                 |

## Test Progress

| Check                        | Status  | Command          |
| ---------------------------- | ------- | ---------------- |
| Repository typecheck         | Passing | `pnpm typecheck` |
| Repository build             | Passing | `pnpm build`     |
| Generated base app smoke     | Passing | `pnpm smoke`     |
| Generated database app smoke | Passing | `pnpm smoke`     |
| Generated auth app smoke     | Passing | `pnpm smoke`     |
| CLI unit tests               | Missing | Planned          |
| Runtime API tests            | Missing | Planned          |
| Auth browser e2e tests       | Missing | Planned          |
| D1 migration smoke           | Missing | Planned          |

## Next Priority

1. Add a shared server-side route guard for protected dashboard behavior.
2. Add runtime smoke tests for `/`, `/api/health`, and `/api/v1/me`.
3. Add CLI unit tests for create/add/doctor and idempotency.
4. Add D1 local migration verification.
5. Add auth browser e2e tests.

## Update Rules

- Mark a status as `Passing` only after an automated check or a documented manual verification.
- Use `Partial` when code exists but behavior is not verified end to end.
- Update this file in the same commit as the behavior change when possible.
- Keep detailed design changes in `PROJECT_DESIGN.md`, not here.
