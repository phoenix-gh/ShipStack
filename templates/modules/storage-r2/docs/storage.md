# Storage

The storage module adds a private Cloudflare R2 bucket and an authenticated file API.

## What It Adds

- `FILES` R2 binding in `wrangler.jsonc`
- `src/db/storage-schema.ts` for file metadata
- `src/features/storage/server.ts` for R2 and metadata operations
- `src/routes/api.v1.files.ts` for `/api/v1/files`

## API

All routes require a Better Auth session.

- `GET /api/v1/files` lists the current user's files.
- `POST /api/v1/files` uploads the raw request body to R2. Pass the original file name with `x-shipstack-filename`.
- `DELETE /api/v1/files?id=<file-id>` deletes one owned file.

Responses use the same JSON envelope as the base API routes.

## Setup

Create the bucket:

```sh
wrangler r2 bucket create shipstack-files
```

Generate and apply the metadata migration:

```sh
pnpm db:generate
pnpm db:cf:migrate:local
```

For production, create the bucket in the target Cloudflare account and run the remote migration command from the database docs.

## Security Notes

- Keep the R2 bucket private by default.
- Do not expose object keys directly to clients.
- Derive ownership from the Better Auth session.
- Check D1 metadata ownership before delete or future download routes.
- Add explicit upload size limits before accepting untrusted large files in production.
