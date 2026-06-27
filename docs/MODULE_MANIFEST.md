# Module Manifest Design

ShipStack modules describe installable functionality such as database, auth, billing, storage, API keys, OpenAPI, API rate limiting, and admin.

The module system should start simple and become more structured as commands mature.

## Goals

- make modules installable by the CLI
- keep module setup idempotent
- collect env vars and docs from modules
- make generated projects easy to inspect
- let community recipes follow the same shape

## Non-Goals

- runtime plugin loading inside generated SaaS apps
- dynamic feature flags for every module
- complex dependency solving in MVP
- supporting every provider in the first version

## Conceptual Manifest

```ts
export interface ShipStackModule {
  id: string;
  name: string;
  description: string;
  category: "core" | "provider" | "recipe";
  dependencies?: string[];
  conflicts?: string[];
  packages?: PackageChanges;
  env?: EnvVarSpec[];
  wrangler?: WranglerChanges;
  files?: FileOperation[];
  patches?: PatchOperation[];
  migrations?: MigrationSpec[];
  scripts?: PackageScriptSpec[];
  docs?: DocSpec[];
  checks?: CheckSpec[];
}
```

## Module Fields

### `id`

Stable machine name.

Examples:

- `database-d1`
- `api`
- `auth-better-auth`
- `billing-stripe`
- `storage-r2`
- `openapi`

### `category`

Use `core` for first-party essential modules, `provider` for provider-specific integrations, and `recipe` for optional higher-level features.

### `dependencies`

Other module IDs required before installation.

Example: `auth-better-auth` depends on `database-d1`.

Example: `api-keys` depends on `database-d1` and `auth-better-auth`.

### `conflicts`

Module IDs that cannot be installed together.

Example: a future `database-postgres` may conflict with `database-d1` unless multi-database support exists.

### `packages`

Dependencies to add to `package.json`.

The CLI should preserve existing dependency versions unless a version conflict is explicit.

### `env`

Environment variables introduced by the module.

```ts
export interface EnvVarSpec {
  name: string;
  scope: "public" | "build" | "runtime" | "local";
  required: boolean;
  example?: string;
  description: string;
}
```

### `wrangler`

Cloudflare bindings or compatibility settings.

Examples:

- D1 database binding
- R2 bucket binding
- compatibility date
- compatibility flags

### `files`

Files copied from the module template.

File operations should support:

- create
- create if missing
- overwrite only with explicit force

### `patches`

Structured edits to existing files.

Prefer structured edits over string replacement when practical:

- JSON for `package.json`
- JSONC-aware edits for `wrangler.jsonc`
- TypeScript AST or stable insertion markers for route trees and schema exports

### `migrations`

Database migrations or schema additions.

MVP can generate migrations through Drizzle commands instead of shipping fixed SQL for every module.

### `docs`

Documentation fragments to add or update.

Docs should include:

- setup steps
- env vars
- commands
- verification path
- troubleshooting

### `checks`

Validation checks used by `shipstack doctor`.

Examples:

- required env var exists
- D1 binding exists in Wrangler config
- migration directory exists
- auth route is registered
- API health route responds successfully
- webhook secret exists

## Idempotency Rules

Running `shipstack add <module>` twice must not:

- duplicate package scripts
- duplicate env vars
- duplicate Wrangler bindings
- duplicate route exports
- duplicate schema exports
- overwrite user-edited files silently

If a file exists and differs from the template, the CLI should either:

- apply a structured patch
- ask for confirmation in interactive mode
- write a `.shipstack.patch` file in non-interactive mode
- fail with a clear message

## Module Installation Flow

1. Read project state.
2. Load module manifest.
3. Check dependencies and conflicts.
4. Preview operations.
5. Apply package changes.
6. Apply file operations.
7. Apply structured patches.
8. Update env examples.
9. Update docs.
10. Run module checks.
11. Print next steps.

## Project State

The CLI should eventually write a state file:

```json
{
  "version": 1,
  "modules": {
    "database-d1": {
      "installedAt": "2026-01-01T00:00:00.000Z",
      "version": "0.1.0"
    }
  }
}
```

Potential filename:

```text
.shipstack/state.json
```

Do not rely only on this state file. Always inspect the real project before patching.

## Generated AGENTS.md Fragment

Every module may contribute AI-agent guidance.

Example:

```md
## Auth Module

- Use `src/features/auth/server.ts` for server-side session access.
- Use `requireUser()` in protected loaders and server functions.
- Do not read session cookies manually in route files.
```

The generated app's `AGENTS.md` should be assembled from installed modules.
