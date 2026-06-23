# Testing

ShipStack tests should prove that generated apps work, not only that repository code compiles.

## Test Levels

### Repository Checks

Run these before committing ordinary code changes:

```sh
pnpm typecheck
pnpm build
```

`pnpm typecheck` validates packages in the monorepo. `pnpm build` produces the CLI packages that smoke tests execute.

### Generated App Smoke Tests

Run the full smoke suite after changing templates, module installers, CLI behavior, package versions, or generated app scripts:

```sh
pnpm smoke
```

The smoke suite creates temporary real apps, installs dependencies, and runs app-level checks:

- `scripts/smoke/cli.mjs` creates an app and checks CLI errors, `doctor`, module dependency ordering, and repeated module installs.
- `scripts/smoke/base.mjs` creates the base TanStack Start app, runs `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, starts the dev server, checks `/`, `/health`, `/api/health`, `/api/v1/me`, trusted API CORS, and default restrictive CORS behavior, then runs `pnpm build`.
- `scripts/smoke/database.mjs` creates an app, installs the D1 database module twice, verifies linting, generates a migration, applies it locally with Wrangler, then runs the same app checks.
- `scripts/smoke/auth.mjs` creates an app, installs database and Better Auth modules, installs auth twice, verifies linting, generates auth migrations, applies them locally with Wrangler, starts the dev server, verifies anonymous dashboard redirect, signs in, checks authenticated `/api/v1/me`, runs browser sign up/sign out/sign in/dashboard checks, then runs the same app checks.

Smoke workspaces are created in the operating system temp directory. Passing runs are removed automatically. Failed runs are kept and printed so the generated project can be inspected.

### Continuous Integration

GitHub Actions runs the same project-level checks on push and pull requests:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
```

The CI workflow installs Playwright Chromium before running smoke tests because the auth smoke includes a real browser flow.

`pnpm test` runs package-level unit tests. `pnpm format:check` verifies repository formatting.

## What To Add Next

Add tests in this order:

1. CLI unit tests around lower-level patching helpers if CLI behavior grows more complex.
2. Manual Cloudflare deploy verification.
3. Confirm the GitHub Actions workflow on the remote repository.
4. More D1 migration edge cases for future schema changes.
5. Module smoke tests for future Stripe, R2, and API key modules.

If a behavior cannot be automated yet, document the manual verification path near the module that introduces it.
