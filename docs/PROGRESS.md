# Progress

This file is the working progress board for ShipStack. Update it whenever a deliverable changes status.

## Current Snapshot

Status: `v0.1.0` MVP release candidate with local verification, remote CI,
real Cloudflare deploy, and remote npm publish workflow dry-run verified.

External verification status in this workspace:

- `pnpm dlx wrangler whoami` reports that Wrangler is authenticated. Do not
  commit Cloudflare account IDs or tokens.
- `pnpm smoke:temporary-deploy` has passed before, but the latest attempt on
  2026-06-24 failed before upload with Wrangler `fetch failed` connectivity
  errors.
- The latest full local release verification on 2026-06-28 passed
  `pnpm verify:release`, including format, typecheck, tests, build,
  package-content checks, generated app smoke tests, recipe installer next-step
  output checks, local D1 migrations, browser auth smoke, generated app
  `wrangler deploy --dry-run`, and module smoke tests for database, auth,
  billing, storage, API keys, OpenAPI, and API rate limiting.
- The latest remote GitHub Actions CI run on 2026-06-28 passed
  `pnpm verify:release` on `master`:
  https://github.com/phoenix-gh/ShipStack/actions/runs/28319955653
- The latest real Cloudflare deploy verification on 2026-06-28 passed for:
  https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
- The latest remote npm publish workflow dry-run on 2026-06-28 passed for
  `@shipstack/core`, `@shipstack/cli`, and `create-shipstack-app`:
  https://github.com/phoenix-gh/ShipStack/actions/runs/28319962801
- The latest full release audit on 2026-06-28 should pass once the release
  evidence updates in this file set are committed.
- The latest local npm publish dry-run on 2026-06-28 passed
  `pnpm publish:dry-run` for `@shipstack/core`, `@shipstack/cli`, and
  `create-shipstack-app`.
- The latest `pnpm smoke` run on 2026-06-28 passed after `bubblewrap` was
  installed. It covered recipe installer next-step output, the base generated
  app `wrangler deploy --dry-run`, local D1 migrations, auth browser smoke, and
  module smoke tests for database, auth, billing, storage, API keys, OpenAPI,
  and API rate limiting.
- `pnpm smoke:temporary-deploy` still needs an explicit maintainer approval
  before rerun because it uploads generated app code to Cloudflare's temporary
  deployment service.
- `git remote -v` is configured for `https://github.com/phoenix-gh/ShipStack.git`.

Last verified:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`
- `pnpm smoke`
- `pnpm pack:check`
- `pnpm verify:local`
- `pnpm verify:release`
- `pnpm publish:dry-run`

Latest commit:

- Run `git log --oneline -1`.

## Phase Progress

| Phase                             | Status      | Notes                                                                                                                                                    |
| --------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | Done        | Product direction, MVP scope, module model, agent guide, and legal boundaries exist.                                                                     |
| Phase 1: Minimal Runnable Starter | Local pass  | Base TanStack Start + Cloudflare Workers template builds, uses Tailwind CSS, has minimal UI primitives, passes smoke tests, and has CI/deploy workflows. |
| Phase 2: Database And Auth        | Local pass  | D1, Drizzle, Better Auth, auth pages, session API, reusable protected route guards, auth migrations, account route, and auth e2e smoke exist.            |
| Phase 3: CLI MVP                  | Local pass  | `create`, `doctor`, `add database`, `add auth`, CLI unit tests, and module-aware doctor checks exist.                                                    |
| Phase 4: Billing And Storage      | Local pass  | Stripe billing and R2 storage modules exist with metadata schema, authenticated APIs, webhook/entitlement handling, and module smoke tests.              |
| Phase 5: Recipes                  | Local pass  | API keys, OpenAPI, and API rate limit recipes exist with docs, CLI installers, and smoke tests.                                                          |
| Phase 6: Ecosystem                | Not started | Docs site, contribution guide, releases, and examples come later.                                                                                        |

## MVP Acceptance Progress

| Acceptance criterion                                   | Status  | Verification                                                                                      |
| ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------- |
| Dependencies install successfully                      | Passing | `pnpm smoke` installs generated apps.                                                             |
| App starts locally                                     | Passing | Base generated app runtime smoke starts the dev server.                                           |
| Home route renders                                     | Passing | Base generated app runtime smoke checks `/`.                                                      |
| Health route returns success                           | Passing | Base generated app runtime smoke checks `/health`.                                                |
| Health API returns success                             | Passing | Base generated app runtime smoke checks `/api/health`.                                            |
| Trusted API CORS stays restrictive by default          | Passing | Base generated app runtime smoke checks trusted and untrusted origins.                            |
| Authenticated `/api/v1/me` returns current user        | Passing | Auth generated app runtime smoke signs in and checks `/api/v1/me`.                                |
| D1 migration runs locally                              | Passing | Database generated app smoke runs generate and local apply.                                       |
| User can sign up                                       | Passing | Auth browser smoke signs up through the generated UI.                                             |
| User can sign in                                       | Passing | Auth browser smoke signs back in through the generated UI.                                        |
| Anonymous user cannot access dashboard                 | Passing | Auth generated app runtime smoke checks dashboard redirect.                                       |
| Authenticated user can access dashboard                | Passing | Auth browser smoke verifies the dashboard after sign up and sign in.                              |
| App builds for Cloudflare Workers                      | Passing | `pnpm smoke` runs generated app builds.                                                           |
| Worker deploy bundle passes local dry-run              | Passing | Base generated app smoke runs `pnpm deploy:dry-run`.                                              |
| Deployed Worker routes can be verified automatically   | Passing | Base generated app smoke runs `pnpm verify:deployed` against dev URL.                             |
| Generated CI and deploy workflows exist                | Passing | Base template includes CI and manual Cloudflare deploy workflows.                                 |
| Generated env files are safe to customize              | Passing | Base smoke and release audit check env examples and `.gitignore`.                                 |
| Generated app Chinese docs exist                       | Passing | Base smoke checks generated app Chinese env and deployment docs.                                  |
| Module Chinese docs exist                              | Passing | Database/auth/billing/storage/API keys/OpenAPI/API rate limit smoke checks generated module docs. |
| Module docs are linked from generated README           | Passing | CLI, module smoke, and pack check verify README module links.                                     |
| Doctor detects missing module docs                     | Passing | CLI unit tests and pack check run doctor with module docs installed.                              |
| Doctor checks base docs and secret guards              | Passing | CLI unit tests, CLI smoke, and pack check cover base doctor checks.                               |
| Local-only release audit exists                        | Passing | `pnpm release:audit:local` skips external gates for local checks.                                 |
| Fast local verification command exists                 | Passing | `pnpm verify:local` runs local repo/package gates without smoke.                                  |
| Deployment docs are complete enough to follow manually | Passing | Generated and maintainer deployment checklists exist.                                             |
| Generated `AGENTS.md` exists and matches layout        | Passing | Base template and installed modules include `AGENTS.md` guidance.                                 |

## Test Progress

| Check                              | Status         | Command                                 |
| ---------------------------------- | -------------- | --------------------------------------- |
| Repository typecheck               | Passing        | `pnpm typecheck`                        |
| Repository build                   | Passing        | `pnpm build`                            |
| CLI behavior smoke                 | Passing        | `pnpm smoke`                            |
| Generated base app smoke           | Passing        | `pnpm smoke`                            |
| Generated database app smoke       | Passing        | `pnpm smoke`                            |
| Generated auth app smoke           | Passing        | `pnpm smoke`                            |
| Generated billing app smoke        | Passing        | `node scripts/smoke/billing.mjs`        |
| Generated storage app smoke        | Passing        | `node scripts/smoke/storage.mjs`        |
| Generated API keys app smoke       | Passing        | `node scripts/smoke/api-keys.mjs`       |
| Generated OpenAPI app smoke        | Passing        | `node scripts/smoke/openapi.mjs`        |
| Generated API rate limit app smoke | Passing        | `node scripts/smoke/api-rate-limit.mjs` |
| Generated app lint                 | Passing        | `pnpm smoke`                            |
| Wrangler deploy dry-run            | Passing        | `pnpm smoke`                            |
| Deployed route verifier            | Passing        | `pnpm smoke`                            |
| Generated env safety               | Passing        | `pnpm smoke`, `pnpm release:audit`      |
| Generated Chinese docs             | Passing        | `pnpm smoke`, `pnpm pack:check`         |
| Generated README current modules   | Passing        | `node scripts/smoke/base.mjs`           |
| Module Chinese docs                | Passing        | `pnpm smoke`, `pnpm pack:check`         |
| Module docs README links           | Passing        | `pnpm smoke`, `pnpm pack:check`         |
| Doctor module docs checks          | Passing        | `pnpm test`, `pnpm pack:check`          |
| Doctor base docs checks            | Passing        | `pnpm test`, `pnpm pack:check`          |
| Local-only release audit           | Passing        | `pnpm release:audit:local`              |
| Fast local verification            | Passing        | `pnpm verify:local`                     |
| Full local release verification    | Passing        | `pnpm verify:release`                   |
| Full release audit                 | Passing        | `pnpm release:audit`                    |
| Local npm publish dry-run          | Passing        | `pnpm publish:dry-run`                  |
| Temporary Cloudflare deploy        | Needs approval | `pnpm smoke:temporary-deploy`           |
| CLI unit tests                     | Passing        | `pnpm test`                             |
| Runtime API tests                  | Passing        | `pnpm smoke`                            |
| API CORS smoke                     | Passing        | `pnpm smoke`                            |
| Auth browser e2e tests             | Passing        | `pnpm smoke`                            |
| D1 migration smoke                 | Passing        | `pnpm smoke`                            |
| Auth migration smoke               | Passing        | `pnpm smoke`                            |
| Stripe billing webhook smoke       | Passing        | `node scripts/smoke/billing.mjs`        |
| R2 storage API smoke               | Passing        | `node scripts/smoke/storage.mjs`        |
| API key bearer auth smoke          | Passing        | `node scripts/smoke/api-keys.mjs`       |
| OpenAPI generation smoke           | Passing        | `node scripts/smoke/openapi.mjs`        |
| API rate limit smoke               | Passing        | `node scripts/smoke/api-rate-limit.mjs` |
| Smoke dev server port retry        | Passing        | `node scripts/smoke/base.mjs`           |
| Module AGENTS guidance             | Passing        | `pnpm test`, `pnpm smoke`               |
| Open-source license                | Added          | `LICENSE`                               |
| Contribution guide                 | Added          | `CONTRIBUTING.md`                       |
| Quickstart docs                    | Passing        | `pnpm release:audit:local`              |
| Security policy                    | Added          | `SECURITY.md`                           |
| Issue and PR templates             | Added          | `.github` templates                     |
| Release checklist                  | Added          | `docs/RELEASE.md`                       |
| npm package contents               | Passing        | `pnpm pack:check`                       |
| CI workflow                        | Added          | GitHub Actions                          |
| Release verification command       | Passing        | `pnpm verify:release`                   |
| v0.1.0 release notes               | Added          | `docs/releases`                         |
| Local npm publish dry-run command  | Passing        | `pnpm publish:dry-run`                  |
| npm publish workflow               | Added          | `.github/workflows/release-npm.yml`     |

## Next Priority

1. Run final `pnpm release:audit` after committing release evidence updates.
2. Push the release evidence commit and confirm remote CI remains green.
3. Prepare the `v0.1.0` tag and real npm publish decision.

## Update Rules

- Mark a status as `Passing` only after an automated check or a documented manual verification.
- Use `Partial` when code exists but behavior is not verified end to end.
- Update this file in the same commit as the behavior change when possible.
- Keep detailed design changes in `PROJECT_DESIGN.md`, not here.
