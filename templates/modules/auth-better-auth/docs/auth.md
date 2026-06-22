# Authentication

This project uses Better Auth.

## Files

- `src/features/auth/server.ts`: Better Auth server instance
- `src/features/auth/client.ts`: Better Auth React client
- `src/features/auth/session.ts`: TanStack Start server helpers
- `src/routes/api.auth.$.ts`: Better Auth handler mounted at `/api/auth/*`
- `src/db/auth-schema.ts`: Better Auth Drizzle schema

## Environment Variables

Local Worker secrets belong in `.dev.vars`:

```text
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:5173"
```

Use Wrangler secrets for production values.

## Database

This module depends on the `database-d1` module. Better Auth requires database tables for users, sessions, accounts, and verification data.

The module adds `src/db/auth-schema.ts` and updates `drizzle.config.ts` so Drizzle Kit can generate migrations for Better Auth tables.
