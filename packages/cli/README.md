# @shipstack/cli

CLI for creating and extending ShipStack apps.

## Commands

```bash
shipstack create my-app
shipstack doctor
shipstack add database
shipstack add auth
shipstack add storage
shipstack add billing
shipstack add api-keys
shipstack add openapi
shipstack add api-rate-limit
```

The generated app targets TanStack Start on Cloudflare Workers. The database
module adds D1 and Drizzle. The auth module adds Better Auth. The storage
module adds Cloudflare R2 file storage with D1 metadata. The billing module adds
Stripe Checkout, portal sessions, webhook-confirmed subscription state, and
entitlement helpers. The API keys recipe adds hashed API keys for
server-to-server, CLI, and partner clients. The OpenAPI recipe generates
OpenAPI 3.1 docs for installed API routes. The API rate limit recipe adds
route-level fixed-window helpers for public and API-key-authenticated routes.

## Status

`0.1.0-alpha.0` is a release candidate package for the first ShipStack MVP.

## Related Packages

- `create-shipstack`
- `@shipstack/core`
