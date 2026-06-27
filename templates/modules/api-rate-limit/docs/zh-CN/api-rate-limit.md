# API Rate Limit 模块

API rate limit 模块会添加一个小型 fixed-window helper，用来保护 API routes，
避免意外突发流量和简单滥用。

在 API keys 之后安装：

```bash
shipstack add api-rate-limit
pnpm install
pnpm test
pnpm build
```

模块会写入：

- `src/features/api/rate-limit.ts`
- `src/features/api/rate-limit.test.ts`
- 一个 `/api/v1/me` route override，用来展示 route-level limiting

## 使用方式

在 server route handler 里，先于昂贵操作调用 `checkRateLimit`：

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

每个 route 都应该显式声明自己的限制。公开 read API、write API 和 integration
webhook 通常需要不同的限制。

## 生产边界

默认 limiter 会把计数存储在当前 Worker process 中。它适合本地开发、测试和小型
starter，但不是全局分布式 quota。

生产规模的 public APIs 更建议使用：

- Cloudflare WAF 或 Rate Limiting Rules
- 未来 Durable Object-backed ShipStack limiter
- 未来基于 KV/R2 的慢速 usage tracking recipe

## 验证

```bash
pnpm test
pnpm build
```
