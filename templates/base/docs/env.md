# Environment Variables

ShipStack separates environment values into clear buckets.

## Public Browser Variables

Stored in `.env` or `.env.local` and exposed through Vite.

```text
VITE_APP_NAME="ShipStack App"
```

Never put secrets in `VITE_*` variables.

## Local Worker Secrets

Copy `.dev.vars.example` to `.dev.vars` for local Worker runtime secrets.

```bash
cp .dev.vars.example .dev.vars
```

## Production Runtime Secrets

Use Wrangler secrets:

```bash
pnpm wrangler secret put SECRET_NAME
```

