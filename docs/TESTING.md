# Testing

ShipStack tests should prove that generated apps work, not only that repository code compiles.

## Test Levels

### Repository Checks

Run these before committing ordinary code changes:

```sh
pnpm verify:local
```

`pnpm verify:local` runs formatting, typecheck, unit tests, build,
`pnpm pack:check`, and `pnpm release:audit:local`. It is the fast local gate
for changes that do not need full generated-app smoke coverage. It allows a
dirty worktree so it can run before you commit.

`pnpm typecheck` validates packages in the monorepo. `pnpm build` produces the
CLI packages that smoke tests execute.

### Generated App Smoke Tests

Run the full smoke suite after changing templates, module installers, CLI behavior, package versions, or generated app scripts:

```sh
pnpm smoke
```

The smoke suite creates temporary real apps, installs dependencies, and runs app-level checks:

- `scripts/smoke/cli.mjs` creates an app and checks CLI errors, `doctor`, module dependency ordering, repeated module installs, and module docs links in the generated README.
- `scripts/smoke/base.mjs` creates the base TanStack Start app, checks env example files, `.gitignore` secret guards, and generated Chinese docs, runs `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, starts the dev server, checks `/`, `/health`, `/api/health`, `/api/v1/me`, trusted API CORS, default restrictive CORS behavior, runs the generated `pnpm verify:deployed` script against the dev server URL, runs `pnpm build`, and runs `pnpm deploy:dry-run`.
- `scripts/smoke/database.mjs` creates an app, installs the D1 database module twice, checks module Chinese docs, verifies linting, generates a migration, applies it locally with Wrangler, then runs the same app checks.
- `scripts/smoke/auth.mjs` creates an app, installs database and Better Auth modules, installs auth twice, checks module Chinese docs, verifies linting, generates auth migrations, applies them locally with Wrangler, starts the dev server, verifies anonymous dashboard redirect, signs in, checks authenticated `/api/v1/me`, runs browser sign up/sign out/sign in/dashboard checks, then runs the same app checks.
- `scripts/smoke/storage.mjs` creates an app, installs database, auth, and R2 storage modules, installs storage twice, checks module Chinese docs, generates and applies metadata migrations, starts the dev server, signs in, uploads a file through `/api/v1/files`, lists it, deletes it, and verifies the file list is empty again.
- `scripts/smoke/billing.mjs` creates an app, installs database, auth, and Stripe billing modules, installs billing twice, checks module Chinese docs, generates and applies billing migrations, starts the dev server, signs in, posts a signed Stripe webhook fixture, verifies idempotency, and checks `/api/v1/billing/status`.
- `scripts/smoke/api-keys.mjs` creates an app, installs database, auth, and API keys modules, installs API keys twice, checks module Chinese docs, generates and applies API key migrations, starts the dev server, signs in, creates an API key, authenticates `/api/v1/me` with `Authorization: Bearer`, revokes the key, and verifies revoked keys no longer authenticate.
- `scripts/smoke/openapi.mjs` creates an app, installs database, auth, storage, billing, API keys, and OpenAPI modules, installs OpenAPI twice, checks module Chinese docs, runs `pnpm openapi:generate`, verifies generated OpenAPI paths, starts the dev server, and checks `/api/openapi`.
- `scripts/smoke/api-rate-limit.mjs` creates an app, installs database, auth, API keys, and API rate limit modules, installs API rate limit twice, checks module Chinese docs, generates and applies migrations, verifies generated tests and build, starts the dev server, and checks a real `RATE_LIMITED` response.

Smoke workspaces are created under `/tmp` on Linux when the inherited temp
directory points at a Windows mount such as `/mnt/c/...`. Set
`SHIPSTACK_SMOKE_TMPDIR=/path/to/tmp` to override this. Passing runs are removed
automatically. Failed runs are kept and printed so the generated project can be
inspected.

### Continuous Integration

GitHub Actions runs the same project-level checks on push and pull requests:

```sh
pnpm verify:release
```

That command runs:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm pack:check
pnpm smoke
```

Use `pnpm verify:local` for the same local repository and package checks
without generated-app smoke tests. It skips external release gates and the clean
worktree check.

Use `pnpm release:audit` when you need a quick status summary of release gates.
It checks local release scaffolding and reports external blockers such as
missing git remotes or unauthenticated Wrangler sessions. External checks are
bounded so transient registry or Cloudflare connectivity does not hide local
gate results.

Use `pnpm release:audit:local` when you only want local gate status and a zero
exit code while external release gates are still intentionally pending.

The CI workflow installs Playwright Chromium before running the release
verification because the auth smoke includes a real browser flow.

`pnpm test` runs package-level unit tests. `pnpm format:check` verifies repository formatting. `pnpm pack:check` verifies that npm package tarballs include the compiled entrypoints and generated-app templates required by the CLI, installs the packed tarballs into a temporary workspace, creates an app from the packed `create-shipstack` CLI, installs database, auth, billing, storage, API keys, OpenAPI, and API rate limit modules from the packed `shipstack` CLI, verifies module docs links, and runs `shipstack doctor`.

Use `pnpm publish:dry-run` before publishing packages. It packs
`@shipstack/core`, `@shipstack/cli`, and `create-shipstack` in dependency order
and runs `npm publish --dry-run --access public --tag next` on each tarball. Set
`NPM_TAG=<tag>` to test another dist-tag. This command is intentionally separate
from `pnpm verify:release` because it exercises npm publish behavior and may
depend on registry availability. It does not publish packages and does not use
npm provenance; provenance is verified by the remote GitHub Actions publish
workflow.

### Optional Temporary Cloudflare Deploy Smoke

When Wrangler is not authenticated, maintainers can still verify a real external
upload and Worker runtime with Cloudflare's temporary deploy flow:

```sh
pnpm smoke:temporary-deploy
```

This command creates a fresh generated app, installs dependencies, runs the
generated app checks, deploys with `wrangler deploy --temporary`, redacts the
temporary account claim URL from logs, and checks the deployed `/health`,
`/api/health`, and `/api/v1/me` routes through the generated
`pnpm verify:deployed` script.

This check is intentionally not part of `pnpm verify:release` because it depends
on Cloudflare's external network and temporary account service. A successful
temporary deploy is useful deployment evidence, but it does not replace the
manual deploy pass with the maintainer's real Cloudflare account.

## What To Add Next

Add tests in this order:

1. CLI unit tests around lower-level patching helpers if CLI behavior grows more complex.
2. Manual Cloudflare deploy verification with the maintainer's real account.
3. Confirm the GitHub Actions workflow on the remote repository.
4. More D1 migration edge cases for future schema changes.
5. Module smoke tests for future API key modules.

If a behavior cannot be automated yet, document the manual verification path near the module that introduces it.
