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

- `scripts/smoke/base.mjs` creates the base TanStack Start app, runs `pnpm install`, `pnpm test`, `pnpm typecheck`, starts the dev server, checks `/`, `/api/health`, and `/api/v1/me`, then runs `pnpm build`.
- `scripts/smoke/database.mjs` creates an app, installs the D1 database module twice, then runs the same app checks.
- `scripts/smoke/auth.mjs` creates an app, installs database and Better Auth modules, installs auth twice, then runs the same app checks.

Smoke workspaces are created in the operating system temp directory. Passing runs are removed automatically. Failed runs are kept and printed so the generated project can be inspected.

## What To Add Next

Add tests in this order:

1. CLI unit tests for create/add/doctor behavior, including existing target errors and module dependency errors.
2. Authenticated runtime API tests for `/api/v1/me`.
3. D1 migration checks for generated schemas.
4. Browser tests for auth sign up, sign in, sign out, and protected dashboard behavior.
5. Module smoke tests for future Stripe, R2, and API key modules.

If a behavior cannot be automated yet, document the manual verification path near the module that introduces it.
