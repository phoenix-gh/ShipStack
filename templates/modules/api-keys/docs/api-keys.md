# API Keys Module

The API keys module adds API-key authentication for server-to-server, CLI, and partner clients.

Install it after database and auth:

```bash
shipstack add database
shipstack add auth
shipstack add api-keys
pnpm db:generate
pnpm db:cf:migrate:local
```

## Routes

- `GET /api/v1/api-keys` lists keys for the signed-in user.
- `POST /api/v1/api-keys` creates a key for the signed-in user.
- `DELETE /api/v1/api-keys?id=<key-id>` revokes a key for the signed-in user.
- `GET /api/v1/me` accepts either a browser session or `Authorization: Bearer <api-key>`.

The plaintext key is returned only once from `POST /api/v1/api-keys`. Store only hashes in D1.

## Create A Key

```bash
curl -X POST http://localhost:5173/api/v1/api-keys \
  -H "content-type: application/json" \
  -b "your-browser-session-cookie" \
  -d '{"name":"CLI key"}'
```

The response includes:

```json
{
  "data": {
    "apiKey": {
      "key": "ss_...",
      "apiKey": {
        "id": "...",
        "name": "CLI key",
        "keyPrefix": "ss_..."
      }
    }
  },
  "error": null,
  "requestId": "..."
}
```

## Authenticate A Client

```bash
curl http://localhost:5173/api/v1/me \
  -H "Authorization: Bearer ss_..."
```

API keys identify the owning user for API requests. Do not use API keys as native mobile user login tokens; native app user auth needs an explicit session or bearer-token design.

## Verification

```bash
pnpm db:generate
pnpm db:cf:migrate:local
pnpm test
pnpm build
```
