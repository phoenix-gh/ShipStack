# 部署到 Cloudflare Workers

这个应用遵循官方 TanStack Start + Cloudflare Workers 路径：

- `@cloudflare/vite-plugin`
- `@tailwindcss/vite`
- `wrangler`
- `@tanstack/react-start/server-entry`
- `compatibility_flags: ["nodejs_compat"]`

## 部署前

安装依赖并在本地验证应用：

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

本地环境示例文件会提交为 `.env.example` 和 `.dev.vars.example`。本地开发时复制为 `.env.local` 和 `.dev.vars`。生成项目里的 `.gitignore` 会避免把这些本地文件提交进版本库。

登录 Cloudflare：

```bash
pnpm dlx wrangler login
```

## 基础应用部署

使用真实凭据前，先运行本地 Wrangler deploy dry-run：

```bash
pnpm deploy:dry-run
```

这个命令会编译 Worker，并让 Wrangler 验证部署 bundle，但不会上传到 Cloudflare。

部署 Worker：

```bash
pnpm deploy
```

部署后，Wrangler 会打印 Worker URL。验证已部署的浏览器和 API health routes：

```bash
pnpm verify:deployed https://<your-worker-url>
```

验证脚本会检查：

- `/health` 返回 health 页面
- `/api/health` 返回 JSON envelope，且 `data.status` 为 `ok`
- 安装 auth 前，`/api/v1/me` 返回匿名 API envelope

也可以手动检查 routes：

```bash
curl https://<your-worker-url>/health
curl https://<your-worker-url>/api/health
curl https://<your-worker-url>/api/v1/me
```

如果浏览器应用、移动端 shell 或桌面客户端要从另一个 origin 调用 API，部署前先配置可信 origin allowlist：

```bash
pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
```

没有具体可信 client origin 之前，保持为空。

## GitHub Actions 部署

生成应用包含两个 workflows：

- `.github/workflows/ci.yml` 在 push 和 pull request 时运行 `pnpm verify`。
- `.github/workflows/deploy.yml` 是手动 `workflow_dispatch` Cloudflare Workers 部署。

使用 deploy workflow 前，在 GitHub 中添加 repository secret：

```text
CLOUDFLARE_API_TOKEN
```

使用可以部署目标 Worker 的 token。生产 runtime secrets，例如 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL` 和 `SHIPSTACK_TRUSTED_ORIGINS`，应放在 Cloudflare Wrangler secrets 中，不要提交到仓库。

## 如果已安装 D1 Database 模块

创建 database：

```bash
pnpm db:cf:create
```

把返回的 `database_id` 复制到 `wrangler.jsonc` 的 `DB` binding。

生成并应用 migrations：

```bash
pnpm db:generate
pnpm db:cf:migrate:local
pnpm db:cf:migrate:remote
```

本地开发使用 `--local` migrations，部署后的 Cloudflare D1 使用 `--remote` migrations。

## 如果已安装 Better Auth 模块

本地 Worker secrets 放在 `.dev.vars`：

```bash
cp .dev.vars.example .dev.vars
```

部署前用 Wrangler 设置生产 secrets：

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
pnpm wrangler secret put BETTER_AUTH_URL
```

`BETTER_AUTH_URL` 使用部署后的 Worker origin，例如 `https://<your-worker-url>`。

部署后，手动验证 auth 路径：

1. 访问 `https://<your-worker-url>/sign-up`。
2. 创建测试账号。
3. 确认注册后 `/dashboard` 能加载。
4. 退出登录。
5. 在 `/sign-in` 重新登录。
6. 确认 `/dashboard` 再次加载。

## 生成 Cloudflare Types

```bash
pnpm cf-typegen
```

## 参考

- [TanStack Start hosting on Cloudflare](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
