# Database

This project uses Cloudflare D1 with Drizzle ORM.

## Files

- `src/db/schema.ts`: Drizzle schema
- `src/db/client.ts`: D1 Drizzle client factory
- `drizzle.config.ts`: Drizzle Kit configuration
- `drizzle/migrations`: generated SQL migrations

## Environment Variables

Drizzle Kit uses the D1 HTTP API for remote operations:

```text
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
```

These values are for local tooling only. Do not expose them to browser code.

## Create A D1 Database

```bash
pnpm db:cf:create
```

Copy the returned database ID into `wrangler.jsonc` and `.env.local`.

## Generate Migrations

```bash
pnpm db:generate
```

## Apply Migrations With Wrangler

Local:

```bash
pnpm db:cf:migrate:local
```

Remote:

```bash
pnpm db:cf:migrate:remote
```

## Drizzle Kit Remote Commands

```bash
pnpm db:push
pnpm db:migrate
pnpm db:studio
```
