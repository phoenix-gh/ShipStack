# 环境变量

ShipStack 把环境值分成几个清楚的类别。

## 浏览器公开变量

这类变量存放在 `.env` 或 `.env.local`，并通过 Vite 暴露给浏览器。需要本地文件时，可以复制 `.env.example`：

```bash
cp .env.example .env.local
```

```text
VITE_APP_NAME="ShipStack App"
```

不要把 secrets 放进 `VITE_*` 变量。

## 本地 Worker Secrets

本地 Worker runtime secrets 放在 `.dev.vars`。先复制示例文件：

```bash
cp .dev.vars.example .dev.vars
```

可信 API client origins 用逗号分隔。保持为空时，默认阻止跨 origin 的浏览器请求。

```text
SHIPSTACK_TRUSTED_ORIGINS="https://app.example.com,https://admin.example.com"
```

D1 模块会把本地 Drizzle tooling 变量追加到 `.env.example`。Better Auth 模块会把本地 auth secrets 追加到 `.dev.vars.example`。

## 生产 Runtime Secrets

生产环境使用 Wrangler secrets：

```bash
pnpm wrangler secret put SECRET_NAME
```

可信 API clients 的 allowlist 也作为 runtime secret 设置：

```bash
pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
```
