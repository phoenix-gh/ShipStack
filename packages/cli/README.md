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
```

The generated app targets TanStack Start on Cloudflare Workers. The database
module adds D1 and Drizzle. The auth module adds Better Auth. The storage
module adds Cloudflare R2 file storage with D1 metadata. The billing module adds
Stripe Checkout, portal sessions, webhook-confirmed subscription state, and
entitlement helpers.

## Status

`0.1.0-alpha.0` is a release candidate package for the first ShipStack MVP.

## Related Packages

- `create-shipstack`
- `@shipstack/core`
