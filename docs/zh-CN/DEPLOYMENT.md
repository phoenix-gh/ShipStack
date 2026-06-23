# 部署验证

这是维护者用来证明生成的 ShipStack 应用可以部署到 Cloudflare Workers 的检查清单。

## 本地可以验证什么

Smoke suite 已经覆盖这些与部署相关的检查：

- fresh 生成应用可以安装依赖
- 应用可以本地启动
- `/` 可以渲染
- `/health` 可以渲染
- `/api/health` 返回成功 envelope
- D1 migrations 可以本地 apply
- auth 注册、退出、登录和受保护 dashboard 本地可用
- 生成应用可以构建到 Cloudflare Workers
- base 生成应用可以通过 `wrangler deploy --dry-run`
- 生成应用包含 CI 和手动 deploy workflows

运行完整检查：

```bash
pnpm smoke
```

维护者也可以在未登录账号的情况下运行可选的 Cloudflare 临时部署 smoke：

```bash
pnpm smoke:temporary-deploy
```

这会验证真实上传到 Cloudflare temporary account 服务，并检查已部署的
`/health`、`/api/health` 和 `/api/v1/me` routes。这是外部网络证据，但不能替代下面的真实账号检查清单。

## Cloudflare 手动部署检查

这份 checklist 需要真实 Cloudflare 账号。

1. 创建 fresh 生成应用。

   ```bash
   pnpm build
   node packages/create-shipstack/dist/cli.js deploy-check-app
   cd deploy-check-app
   ```

2. 安装依赖并验证基础应用。

   ```bash
   pnpm install
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm deploy:dry-run
   ```

3. 登录 Cloudflare。

   ```bash
   pnpm dlx wrangler login
   ```

4. 部署基础应用。

   ```bash
   pnpm deploy
   ```

5. 检查线上 routes。

   ```bash
   curl https://<your-worker-url>/health
   curl https://<your-worker-url>/api/health
   curl https://<your-worker-url>/api/v1/me
   ```

   预期结果：

   - `/health` 返回包含 `System health is ok.` 的 HTML 页面
   - `/api/health` 返回 JSON envelope，且 `data.status` 等于 `ok`
   - auth 安装前，`/api/v1/me` 返回匿名 envelope

6. 如果浏览器应用、mobile shell 或桌面客户端会从另一个 origin 调用 API，设置逗号分隔的 trusted origin allowlist。

   ```bash
   pnpm wrangler secret put SHIPSTACK_TRUSTED_ORIGINS
   ```

   在有明确可信客户端 origin 之前保持为空。为空时，CORS 默认保持收紧。

## D1 和 Auth 手动部署检查

验证 database 和 auth 模块时，在生成应用里继续执行这些步骤。

1. 安装模块。

   ```bash
   node ../packages/cli/dist/cli.js add database
   node ../packages/cli/dist/cli.js add auth
   pnpm install
   ```

   如果生成应用不在仓库目录旁边，需要调整 CLI 路径。

2. 创建 D1 database。

   ```bash
   pnpm db:cf:create
   ```

3. 把返回的 `database_id` 复制到 `wrangler.jsonc` 的 `DB` binding。

4. 生成并应用 migrations。

   ```bash
   pnpm db:generate
   pnpm db:cf:migrate:local
   pnpm db:cf:migrate:remote
   ```

5. 设置生产 auth secrets。

   ```bash
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put BETTER_AUTH_URL
   ```

   `BETTER_AUTH_URL` 使用已部署的 Worker origin。

6. 再次部署。

   ```bash
   pnpm deploy
   ```

7. 在浏览器里手动验证 auth。

   - 访问 `/sign-up`
   - 创建测试账号
   - 确认 `/dashboard` 可以加载
   - 退出登录
   - 在 `/sign-in` 重新登录
   - 再次确认 `/dashboard` 可以加载

## 当前手动状态

当前 workspace 已通过 `pnpm smoke:temporary-deploy` 完成 Cloudflare 临时部署验证。真实账号部署验证还没有记录。生成应用已经包含维护者或贡献者拿到 Cloudflare 凭据后完成部署验证所需的命令和 route checks。

## 参考资料

- [TanStack Start hosting on Cloudflare](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Cloudflare Workers Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
