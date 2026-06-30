# Quickstart

Use this guide to create a ShipStack app, run it locally, add the MVP modules,
and verify the result.

## Create An App

The fixed alpha is currently published under the `next` npm dist-tag while
`latest` is still blocked on npm dist-tag write permissions. Use `@next` until
`latest` moves to `0.1.0-alpha.1`:

```sh
pnpm create shipstack-app@next my-app
cd my-app
pnpm install
pnpm dev
```

While working from this repository before the first publish, build the packages
and run the local create entrypoint:

```sh
pnpm install
pnpm build
node packages/create-shipstack/dist/cli.js my-app
cd my-app
pnpm install
pnpm dev
```

Open the local URL printed by the dev server. The base app includes:

- `/`
- `/health`
- `/api/health`
- `/api/v1/me`
- a dashboard route
- Cloudflare Workers configuration
- generated CI and deploy workflows
- generated `AGENTS.md`

## Add MVP Modules

Install modules in dependency order:

```sh
shipstack add database
shipstack add auth
shipstack add billing
shipstack add storage
shipstack add api-keys
shipstack add openapi
shipstack add api-rate-limit
pnpm install
```

If you are testing from this repository before packages are installed globally,
run the local CLI from inside the generated app:

```sh
node ../packages/cli/dist/cli.js add database
node ../packages/cli/dist/cli.js add auth
node ../packages/cli/dist/cli.js add billing
node ../packages/cli/dist/cli.js add storage
node ../packages/cli/dist/cli.js add api-keys
node ../packages/cli/dist/cli.js add openapi
node ../packages/cli/dist/cli.js add api-rate-limit
pnpm install
```

## Configure Local Environment

Copy the example files before running auth or integration modules:

```sh
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

Use development-only values locally. Never commit real secrets.

## Generate And Apply Local Migrations

Database-backed modules use Drizzle schema and Cloudflare D1:

```sh
pnpm db:generate
pnpm openapi:generate
pnpm db:cf:migrate:local
```

`pnpm openapi:generate` is only needed after installing the OpenAPI recipe or
changing API route descriptions.

## Verify The App

Run the generated app checks:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm deploy:dry-run
```

When the app is running locally, verify the runtime routes:

```sh
pnpm verify:deployed http://127.0.0.1:<port>
```

Replace `<port>` with the dev server port.

## Deploy Later

Use the deployment guide when you are ready to deploy with a real Cloudflare
account:

- [Deployment Verification](./DEPLOYMENT.md)
- generated app `docs/deployment.md`

The project records passing real Cloudflare deploy verification, remote GitHub
Actions verification, and remote npm publish workflow dry-run evidence in
`docs/RELEASE_EVIDENCE.md`.
