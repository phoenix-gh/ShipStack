# OpenAPI 模块

OpenAPI 模块会为已安装的 ShipStack API routes 生成 OpenAPI 3.1 文档。

安装：

```bash
shipstack add openapi
pnpm openapi:generate
```

生成器会写入：

- `public/openapi.json`
- `src/features/openapi/generated.ts`

应用也会通过以下路径提供生成后的 spec：

```text
/api/openapi
```

## 什么时候重新生成

添加或移除 API modules 后运行：

```bash
pnpm openapi:generate
```

生成器会检测已安装的 route files，并包含对应 paths，例如：

- `/api/health`
- `/api/v1/me`
- `/api/v1/api-keys`
- `/api/v1/files`
- `/api/v1/billing/status`
- `/api/v1/billing/checkout`
- `/api/v1/billing/portal`
- `/api/stripe/webhook`

## 验证

```bash
pnpm openapi:generate
pnpm lint
pnpm build
```

运行中的应用可以这样检查：

```bash
curl http://localhost:5173/api/openapi
```

## 边界

生成器会文档化第一方模块安装的 ShipStack routes。自定义应用 routes 的 API contract 稳定后，应把对应定义加入 `scripts/generate-openapi.mjs`。
