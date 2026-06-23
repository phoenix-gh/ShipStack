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

| Phase                             | Status      | Notes                                                                                                                                                   |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | Done        | Product direction, MVP scope, module model, agent guide, and legal boundaries exist.                                                                    |
| Phase 1: Minimal Runnable Starter | Mostly done | Base TanStack Start + Cloudflare Workers template builds, passes generated-app smoke tests, and has a CI workflow. Final UI primitive decision remains. |
| Phase 2: Database And Auth        | In progress | D1, Drizzle, Better Auth, auth pages, session API, protected dashboard/account guards, auth migrations, account route, and auth e2e smoke exist.        |
| Phase 3: CLI MVP                  | In progress | `create`, `doctor`, `add database`, and `add auth` exist. CLI unit tests and stronger doctor checks remain.                                             |
| Phase 4: Billing And Storage      | Not started | Stripe and R2 are planned after the base path is reliable.                                                                                              |
| Phase 5: Recipes                  | Not started | Recipes wait until MVP modules are stable.                                                                                                              |
| Phase 6: Ecosystem                | Not started | Docs site, contribution guide, releases, and examples come later.                                                                                       |

## MVP Acceptance Progress

| Acceptance criterion                                   | Status  | Verification                                                         |
| ------------------------------------------------------ | ------- | -------------------------------------------------------------------- |
| Dependencies install successfully                      | Passing | `pnpm smoke` installs generated apps.                                |
| App starts locally                                     | Passing | Base generated app runtime smoke starts the dev server.              |
| Home route renders                                     | Passing | Base generated app runtime smoke checks `/`.                         |
| Health route returns success                           | Passing | Base generated app runtime smoke checks `/health`.                   |
| Health API returns success                             | Passing | Base generated app runtime smoke checks `/api/health`.               |
| Authenticated `/api/v1/me` returns current user        | Passing | Auth generated app runtime smoke signs in and checks `/api/v1/me`.   |
| D1 migration runs locally                              | Passing | Database generated app smoke runs generate and local apply.          |
| User can sign up                                       | Passing | Auth browser smoke signs up through the generated UI.                |
| User can sign in                                       | Passing | Auth browser smoke signs back in through the generated UI.           |
| Anonymous user cannot access dashboard                 | Passing | Auth generated app runtime smoke checks dashboard redirect.          |
| Authenticated user can access dashboard                | Passing | Auth browser smoke verifies the dashboard after sign up and sign in. |
| App builds for Cloudflare Workers                      | Passing | `pnpm smoke` runs generated app builds.                              |
| Deployment docs are complete enough to follow manually | Passing | Generated and maintainer deployment checklists exist.                |
| Generated `AGENTS.md` exists and matches layout        | Passing | Base template includes `AGENTS.md`.                                  |

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
| Runtime API tests            | Passing | `pnpm smoke`     |
| Auth browser e2e tests       | Passing | `pnpm smoke`     |
| D1 migration smoke           | Passing | `pnpm smoke`     |
| Auth migration smoke         | Passing | `pnpm smoke`     |
| CI workflow                  | Added   | GitHub Actions   |

## Next Priority

1. Run manual Cloudflare deploy verification with real credentials.
2. Confirm the GitHub Actions workflow on the remote repository.
3. Add manual route checks to deployment documentation.
4. Add lower-level CLI unit tests if patching helpers become more complex.
5. Extract a reusable protected route helper if more protected routes are added.

## Update Rules

- Mark a status as `Passing` only after an automated check or a documented manual verification.
- Use `Partial` when code exists but behavior is not verified end to end.
- Update this file in the same commit as the behavior change when possible.
- Keep detailed design changes in `PROJECT_DESIGN.md`, not here.
