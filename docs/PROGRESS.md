# Progress

This file is the working progress board for ShipStack. Update it whenever a deliverable changes status.

## Current Snapshot

Status: building toward `v0.1.0` MVP.

Last verified:

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke`

Latest commit:

- Run `git log --oneline -1`.

## Phase Progress

| Phase                             | Status      | Notes                                                                                                                                     |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | Done        | Product direction, MVP scope, module model, agent guide, and legal boundaries exist.                                                      |
| Phase 1: Minimal Runnable Starter | Mostly done | Base TanStack Start + Cloudflare Workers template builds and passes generated-app smoke tests. CI and final UI primitive decision remain. |
| Phase 2: Database And Auth        | In progress | D1, Drizzle, Better Auth, auth pages, session API, protected dashboard/account guards, and account route exist. Auth e2e tests remain.    |
| Phase 3: CLI MVP                  | In progress | `create`, `doctor`, `add database`, and `add auth` exist. CLI unit tests and stronger doctor checks remain.                               |
| Phase 4: Billing And Storage      | Not started | Stripe and R2 are planned after the base path is reliable.                                                                                |
| Phase 5: Recipes                  | Not started | Recipes wait until MVP modules are stable.                                                                                                |
| Phase 6: Ecosystem                | Not started | Docs site, contribution guide, releases, and examples come later.                                                                         |

## MVP Acceptance Progress

| Acceptance criterion                                   | Status        | Verification                                                        |
| ------------------------------------------------------ | ------------- | ------------------------------------------------------------------- |
| Dependencies install successfully                      | Passing       | `pnpm smoke` installs generated apps.                               |
| App starts locally                                     | Passing       | Base generated app runtime smoke starts the dev server.             |
| Home route renders                                     | Passing       | Base generated app runtime smoke checks `/`.                        |
| Health route returns success                           | Not automated | Route exists, but runtime check remains.                            |
| Health API returns success                             | Passing       | Base generated app runtime smoke checks `/api/health`.              |
| Authenticated `/api/v1/me` returns current user        | Partial       | Anonymous runtime smoke exists; authenticated runtime test remains. |
| D1 migration runs locally                              | Passing       | Database generated app smoke runs generate and local apply.         |
| User can sign up                                       | Partial       | Auth page and Better Auth route exist; e2e test remains.            |
| User can sign in                                       | Partial       | Auth page and Better Auth route exist; e2e test remains.            |
| Anonymous user cannot access dashboard                 | Partial       | Server-side route guard exists; runtime redirect test remains.      |
| Authenticated user can access dashboard                | Partial       | Dashboard UI supports session state; e2e test remains.              |
| App builds for Cloudflare Workers                      | Passing       | `pnpm smoke` runs generated app builds.                             |
| Deployment docs are complete enough to follow manually | Partial       | Base docs exist; full manual deploy pass remains.                   |
| Generated `AGENTS.md` exists and matches layout        | Passing       | Base template includes `AGENTS.md`.                                 |

## Test Progress

| Check                        | Status  | Command          |
| ---------------------------- | ------- | ---------------- |
| Repository typecheck         | Passing | `pnpm typecheck` |
| Repository build             | Passing | `pnpm build`     |
| CLI behavior smoke           | Passing | `pnpm smoke`     |
| Generated base app smoke     | Passing | `pnpm smoke`     |
| Generated database app smoke | Passing | `pnpm smoke`     |
| Generated auth app smoke     | Passing | `pnpm smoke`     |
| CLI unit tests               | Missing | Future           |
| Runtime API tests            | Partial | `pnpm smoke`     |
| Auth browser e2e tests       | Missing | Planned          |
| D1 migration smoke           | Passing | `pnpm smoke`     |

## Next Priority

1. Add authenticated runtime test for `/api/v1/me`.
2. Add auth browser e2e tests.
3. Add auth module migration verification.
4. Add lower-level CLI unit tests if patching helpers become more complex.
5. Extract a reusable protected route helper if more protected routes are added.

## Update Rules

- Mark a status as `Passing` only after an automated check or a documented manual verification.
- Use `Partial` when code exists but behavior is not verified end to end.
- Update this file in the same commit as the behavior change when possible.
- Keep detailed design changes in `PROJECT_DESIGN.md`, not here.
