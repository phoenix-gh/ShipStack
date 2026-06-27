# API Rate Limit Module

The API rate limit module adds a small fixed-window helper for protecting API
routes from accidental bursts and simple abuse.

Install it after API keys:

```bash
shipstack add api-rate-limit
pnpm test
pnpm build
```

The module writes:

- `src/features/api/rate-limit.ts`
- `src/features/api/rate-limit.test.ts`
- an `/api/v1/me` route override that demonstrates route-level limiting

## Usage

Use `checkRateLimit` inside server route handlers before expensive work:

```ts
const result = checkRateLimit(request, {
  key: getClientRateLimitKey(request, "api:v1:example"),
  limit: 60,
  windowSeconds: 60,
});

if (!result.allowed) {
  return rateLimitResponse(result);
}
```

Keep limits explicit per route. A public read API, a write API, and an
integration webhook usually need different limits.

## Production Boundary

The default limiter stores counters in the current Worker process. That is good
enough for local development, tests, and small starters, but it is not a global
distributed quota.

For production-scale public APIs, prefer one of these:

- Cloudflare WAF or Rate Limiting Rules at the edge
- a future Durable Object-backed ShipStack limiter
- a future KV/R2-backed usage tracking recipe for slower quotas

## Verification

```bash
pnpm test
pnpm build
```
