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

## Optional Google OAuth

Email/password works without OAuth. To enable Google as an optional provider,
set both Google OAuth secrets:

```text
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Create a Google OAuth web client and add redirect URIs that match the Better
Auth callback path:

```text
http://localhost:5173/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

Keep `BETTER_AUTH_URL` set to the current app origin so Better Auth can build
the same callback URL that is registered with Google.

This module does not add a Google button to the default local-first UI. Add one
in your app UI when you are ready to require OAuth:

```tsx
import { authClient } from "~/features/auth/client";

await authClient.signIn.social({
  provider: "google",
});
```

For production, set the optional values with Wrangler:

```bash
pnpm wrangler secret put GOOGLE_CLIENT_ID
pnpm wrangler secret put GOOGLE_CLIENT_SECRET
```

## Database

This module depends on the `database-d1` module. Better Auth requires database tables for users, sessions, accounts, and verification data.

The module adds `src/db/auth-schema.ts` and updates `drizzle.config.ts` so Drizzle Kit can generate migrations for Better Auth tables.
