# 认证

这个项目使用 Better Auth。

## 文件

- `src/features/auth/server.ts`：Better Auth server instance
- `src/features/auth/client.ts`：Better Auth React client
- `src/features/auth/session.ts`：TanStack Start server helpers
- `src/features/auth/route-guards.ts`：protected route guard helpers
- `src/routes/api.auth.$.ts`：挂载在 `/api/auth/*` 的 Better Auth handler
- `src/db/auth-schema.ts`：Better Auth Drizzle schema

## 环境变量

本地 Worker secrets 放在 `.dev.vars`：

```text
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:5173"
```

生产值使用 Wrangler secrets。

## 受保护 Routes

需要登录用户的页面，在 route `beforeLoad` 中使用 `requireRouteSession`：

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { requireRouteSession } from "~/features/auth/route-guards";

export const Route = createFileRoute("/example")({
  beforeLoad: requireRouteSession,
  component: ExamplePage,
});
```

这个 helper 会把匿名用户重定向到 `/sign-in`。服务端 API handlers 应该从 Better
Auth session data 或未来 API key 模块推导身份，不要信任客户端传入的 user ID。

## 可选 Google OAuth

Email/password 不需要 OAuth 也能工作。要把 Google 作为可选 provider，设置两个
Google OAuth secrets：

```text
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

创建 Google OAuth web client，并添加匹配 Better Auth callback path 的 redirect URIs：

```text
http://localhost:5173/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

保持 `BETTER_AUTH_URL` 指向当前 app origin，这样 Better Auth 生成的 callback URL
会和 Google 中注册的一致。

这个模块不会给默认 local-first UI 添加 Google 按钮。等你的 app 准备好要求 OAuth
时，再在 UI 中添加：

```tsx
import { authClient } from "~/features/auth/client";

await authClient.signIn.social({
  provider: "google",
});
```

生产环境中，用 Wrangler 设置这些可选值：

```bash
pnpm wrangler secret put GOOGLE_CLIENT_ID
pnpm wrangler secret put GOOGLE_CLIENT_SECRET
```

## 数据库

这个模块依赖 `database-d1` 模块。Better Auth 需要 users、sessions、accounts 和
verification data 对应的数据表。

模块会添加 `src/db/auth-schema.ts`，并更新 `drizzle.config.ts`，让 Drizzle Kit
可以为 Better Auth tables 生成 migrations。
