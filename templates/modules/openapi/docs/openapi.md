# OpenAPI Module

The OpenAPI module generates an OpenAPI 3.1 document for installed ShipStack API routes.

Install it with:

```bash
shipstack add openapi
pnpm openapi:generate
```

The generator writes:

- `public/openapi.json`
- `src/features/openapi/generated.ts`

The app also serves the generated spec from:

```text
/api/openapi
```

## When To Regenerate

Run this command after adding or removing API modules:

```bash
pnpm openapi:generate
```

The generator detects installed route files and includes matching paths such as:

- `/api/health`
- `/api/v1/me`
- `/api/v1/api-keys`
- `/api/v1/files`
- `/api/v1/billing/status`
- `/api/v1/billing/checkout`
- `/api/v1/billing/portal`
- `/api/stripe/webhook`

## Verification

```bash
pnpm openapi:generate
pnpm lint
pnpm build
```

For a running app:

```bash
curl http://localhost:5173/api/openapi
```

## Boundaries

The generator documents ShipStack routes installed by first-party modules. Custom application routes should be added to `scripts/generate-openapi.mjs` when their API contract is stable.
