# Development

## Toolchain

Use a recent Node.js and pnpm environment.

Minimum versions:

- Node.js 22.12+
- pnpm 10+

## Install

```bash
pnpm install
```

## Verify The Workspace

```bash
pnpm typecheck
pnpm build
```

Run the generated-app smoke suite when template or CLI behavior changes:

```bash
pnpm smoke
```

## Generate A Smoke App

Build the CLI first:

```bash
pnpm build
```

Then create a temporary app:

```bash
mkdir -p /tmp/shipstack-smoke
cd /tmp/shipstack-smoke
node /path/to/ShipStack/packages/create-shipstack/dist/cli.js smoke-app
cd smoke-app
pnpm install
pnpm test
pnpm typecheck
```

The generated app uses TanStack Router route generation. `pnpm typecheck` runs `pnpm generate:routes` before `tsc`.

## pnpm Build Scripts

pnpm 10 may warn that dependency build scripts for packages such as `esbuild` or `workerd` were ignored. If local dev or build needs those scripts, run:

```bash
pnpm approve-builds
```

Only approve packages you trust.
