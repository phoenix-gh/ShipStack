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

Set trusted API client origins as a comma-separated allowlist. Leave this empty
to keep cross-origin browser requests blocked by default.

```text
SHIPSTACK_TRUSTED_ORIGINS="https://app.example.com,https://admin.example.com"
```

## Production Runtime Secrets

Use Wrangler secrets:

```bash
pnpm wrangler secret put SECRET_NAME
```

For trusted API clients, set the same allowlist as a runtime secret:

```bash
pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
```
