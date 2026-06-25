# Progress

This file is the working progress board for ShipStack. Update it whenever a deliverable changes status.

## Current Snapshot

Status: local `v0.1.0` MVP release candidate. External Cloudflare deploy and remote CI verification are still pending.

External verification status in this workspace:

- `pnpm dlx wrangler whoami` reports that Wrangler is not authenticated.
- `pnpm smoke:temporary-deploy` has passed before, but the latest attempt on
  2026-06-24 failed before upload with Wrangler `fetch failed` connectivity
  errors.
- The latest `pnpm verify:release` retry on 2026-06-24 reached generated app
  dependency installation, then was stopped after repeated npm registry
  `ECONNRESET` failures. No ShipStack code failure was observed before the
  network stall.
- `git remote -v` has no configured remote, so remote GitHub Actions cannot be checked from this workspace.

Last verified:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`
- `pnpm smoke`
- `pnpm pack:check`
- `pnpm verify:local`
- `pnpm verify:release`

Latest commit:

- Run `git log --oneline -1`.

## Phase Progress

| Phase                             | Status      | Notes                                                                                                                                                    |
| --------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | Done        | Product direction, MVP scope, module model, agent guide, and legal boundaries exist.                                                                     |
| Phase 1: Minimal Runnable Starter | Local pass  | Base TanStack Start + Cloudflare Workers template builds, uses Tailwind CSS, has minimal UI primitives, passes smoke tests, and has CI/deploy workflows. |
| Phase 2: Database And Auth        | Local pass  | D1, Drizzle, Better Auth, auth pages, session API, reusable protected route guards, auth migrations, account route, and auth e2e smoke exist.            |
| Phase 3: CLI MVP                  | Local pass  | `create`, `doctor`, `add database`, `add auth`, CLI unit tests, and module-aware doctor checks exist.                                                    |
| Phase 4: Billing And Storage      | Partial     | R2 storage module, metadata schema, authenticated files API, and storage smoke exist. Stripe billing has not started.                                    |
| Phase 5: Recipes                  | Not started | Recipes wait until MVP modules are stable.                                                                                                               |
| Phase 6: Ecosystem                | Not started | Docs site, contribution guide, releases, and examples come later.                                                                                        |

## MVP Acceptance Progress

| Acceptance criterion                                   | Status  | Verification                                                           |
| ------------------------------------------------------ | ------- | ---------------------------------------------------------------------- |
| Dependencies install successfully                      | Passing | `pnpm smoke` installs generated apps.                                  |
| App starts locally                                     | Passing | Base generated app runtime smoke starts the dev server.                |
| Home route renders                                     | Passing | Base generated app runtime smoke checks `/`.                           |
| Health route returns success                           | Passing | Base generated app runtime smoke checks `/health`.                     |
| Health API returns success                             | Passing | Base generated app runtime smoke checks `/api/health`.                 |
| Trusted API CORS stays restrictive by default          | Passing | Base generated app runtime smoke checks trusted and untrusted origins. |
| Authenticated `/api/v1/me` returns current user        | Passing | Auth generated app runtime smoke signs in and checks `/api/v1/me`.     |
| D1 migration runs locally                              | Passing | Database generated app smoke runs generate and local apply.            |
| User can sign up                                       | Passing | Auth browser smoke signs up through the generated UI.                  |
| User can sign in                                       | Passing | Auth browser smoke signs back in through the generated UI.             |
| Anonymous user cannot access dashboard                 | Passing | Auth generated app runtime smoke checks dashboard redirect.            |
| Authenticated user can access dashboard                | Passing | Auth browser smoke verifies the dashboard after sign up and sign in.   |
| App builds for Cloudflare Workers                      | Passing | `pnpm smoke` runs generated app builds.                                |
| Worker deploy bundle passes local dry-run              | Passing | Base generated app smoke runs `pnpm deploy:dry-run`.                   |
| Deployed Worker routes can be verified automatically   | Passing | Base generated app smoke runs `pnpm verify:deployed` against dev URL.  |
| Generated CI and deploy workflows exist                | Passing | Base template includes CI and manual Cloudflare deploy workflows.      |
| Generated env files are safe to customize              | Passing | Base smoke and release audit check env examples and `.gitignore`.      |
| Generated app Chinese docs exist                       | Passing | Base smoke checks generated app Chinese env and deployment docs.       |
| Module Chinese docs exist                              | Passing | Database/auth/storage smoke checks generated module Chinese docs.      |
| Module docs are linked from generated README           | Passing | CLI, storage smoke, and pack check verify README module links.         |
| Doctor detects missing module docs                     | Passing | CLI unit tests and pack check run doctor with module docs installed.   |
| Doctor checks base docs and secret guards              | Passing | CLI unit tests, CLI smoke, and pack check cover base doctor checks.    |
| Local-only release audit exists                        | Passing | `pnpm release:audit:local` skips external gates for local checks.      |
| Fast local verification command exists                 | Passing | `pnpm verify:local` runs local repo/package gates without smoke.       |
| Deployment docs are complete enough to follow manually | Passing | Generated and maintainer deployment checklists exist.                  |
| Generated `AGENTS.md` exists and matches layout        | Passing | Base template and installed modules include `AGENTS.md` guidance.      |

## Test Progress

| Check                        | Status           | Command                             |
| ---------------------------- | ---------------- | ----------------------------------- |
| Repository typecheck         | Passing          | `pnpm typecheck`                    |
| Repository build             | Passing          | `pnpm build`                        |
| CLI behavior smoke           | Passing          | `pnpm smoke`                        |
| Generated base app smoke     | Passing          | `pnpm smoke`                        |
| Generated database app smoke | Passing          | `pnpm smoke`                        |
| Generated auth app smoke     | Passing          | `pnpm smoke`                        |
| Generated storage app smoke  | Passing          | `node scripts/smoke/storage.mjs`    |
| Generated app lint           | Passing          | `pnpm smoke`                        |
| Wrangler deploy dry-run      | Passing          | `pnpm smoke`                        |
| Deployed route verifier      | Passing          | `pnpm smoke`                        |
| Generated env safety         | Passing          | `pnpm smoke`, `pnpm release:audit`  |
| Generated Chinese docs       | Passing          | `pnpm smoke`, `pnpm pack:check`     |
| Module Chinese docs          | Passing          | `pnpm smoke`, `pnpm pack:check`     |
| Module docs README links     | Passing          | `pnpm smoke`, `pnpm pack:check`     |
| Doctor module docs checks    | Passing          | `pnpm test`, `pnpm pack:check`      |
| Doctor base docs checks      | Passing          | `pnpm test`, `pnpm pack:check`      |
| Local-only release audit     | Passing          | `pnpm release:audit:local`          |
| Fast local verification      | Passing          | `pnpm verify:local`                 |
| Temporary Cloudflare deploy  | External blocked | `pnpm smoke:temporary-deploy`       |
| CLI unit tests               | Passing          | `pnpm test`                         |
| Runtime API tests            | Passing          | `pnpm smoke`                        |
| API CORS smoke               | Passing          | `pnpm smoke`                        |
| Auth browser e2e tests       | Passing          | `pnpm smoke`                        |
| D1 migration smoke           | Passing          | `pnpm smoke`                        |
| Auth migration smoke         | Passing          | `pnpm smoke`                        |
| R2 storage API smoke         | Passing          | `node scripts/smoke/storage.mjs`    |
| Module AGENTS guidance       | Passing          | `pnpm test`, `pnpm smoke`           |
| Open-source license          | Added            | `LICENSE`                           |
| Contribution guide           | Added            | `CONTRIBUTING.md`                   |
| Security policy              | Added            | `SECURITY.md`                       |
| Issue and PR templates       | Added            | `.github` templates                 |
| Release checklist            | Added            | `docs/RELEASE.md`                   |
| npm package contents         | Passing          | `pnpm pack:check`                   |
| CI workflow                  | Added            | GitHub Actions                      |
| Release verification command | Passing          | `pnpm verify:release`               |
| v0.1.0 release notes         | Added            | `docs/releases`                     |
| npm publish workflow         | Added            | `.github/workflows/release-npm.yml` |

## Next Priority

1. Run manual Cloudflare deploy verification with real credentials.
2. Confirm the GitHub Actions workflow on the remote repository.
3. Run the npm publish workflow in dry-run mode on the remote repository.
4. Start the first post-MVP module after real deploy verification.

## Update Rules

- Mark a status as `Passing` only after an automated check or a documented manual verification.
- Use `Partial` when code exists but behavior is not verified end to end.
- Update this file in the same commit as the behavior change when possible.
- Keep detailed design changes in `PROJECT_DESIGN.md`, not here.
