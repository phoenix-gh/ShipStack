# 测试

ShipStack 的测试应该证明生成出来的应用真的可用，而不只是证明仓库代码可以编译。

## 测试层级

### 仓库检查

普通代码变更提交前运行：

```sh
pnpm verify:local
```

`pnpm verify:local` 会运行格式检查、typecheck、单元测试、build、
`pnpm pack:check` 和 `pnpm release:audit:local`。这是不需要完整生成应用 smoke
覆盖时的快速本地 gate。它允许 dirty worktree，因此可以在提交前运行。

`pnpm typecheck` 校验 monorepo 内的包。`pnpm build` 会产出 smoke test 需要执行的 CLI 包。

### 生成应用 Smoke Tests

修改模板、模块安装器、CLI 行为、包版本或生成应用脚本后，运行完整 smoke suite：

```sh
pnpm smoke
```

Smoke suite 会创建临时的真实应用，安装依赖，并运行应用级检查：

- `scripts/smoke/cli.mjs` 创建应用，并检查 CLI 错误、`doctor`、模块依赖顺序、重复安装模块，以及生成 README 中的模块文档链接。
- `scripts/smoke/base.mjs` 创建基础 TanStack Start 应用，检查 env example files、`.gitignore` secret guards 和生成应用中文文档，运行 `pnpm install`、`pnpm test`、`pnpm lint`、`pnpm typecheck`，启动 dev server，检查 `/`、`/health`、`/api/health`、`/api/v1/me`、trusted API CORS、默认收紧的 CORS 行为，用 dev server URL 运行生成应用里的 `pnpm verify:deployed`，然后运行 `pnpm build` 和 `pnpm deploy:dry-run`。
- `scripts/smoke/database.mjs` 创建应用，重复安装两次 D1 database 模块，检查模块中文文档，验证 lint，生成 migration，用 Wrangler 本地应用 migration，然后运行同样的应用检查。
- `scripts/smoke/auth.mjs` 创建应用，安装 database 与 Better Auth 模块，重复安装两次 auth 模块，检查模块中文文档，验证 lint，生成 auth migrations，用 Wrangler 本地应用 migrations，启动 dev server，验证匿名 dashboard redirect，登录后检查认证态 `/api/v1/me`，运行浏览器注册、退出、登录和 dashboard 检查，然后运行同样的应用检查。

Smoke 工作目录会创建在操作系统临时目录中。通过的运行会自动删除。失败的运行会保留并打印路径，方便检查生成项目。

### 持续集成

GitHub Actions 会在 push 和 pull request 时运行同样的项目级检查：

```sh
pnpm verify:release
```

这个命令会运行：

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm pack:check
pnpm smoke
```

如果只需要本地仓库和 package 检查、不跑生成应用 smoke tests，可以运行
`pnpm verify:local`。它会跳过外部 release gates 和 clean worktree 检查。

需要快速查看 release gate 状态时，可以运行 `pnpm release:audit`。它会检查本地
release 脚手架，并报告缺少 git remote、Wrangler 未登录等外部阻塞项。外部检查会
限制耗时，避免 registry 或 Cloudflare 临时网络问题遮住本地 gate 结果。

只想检查本地 gate、并且在外部 release gates 尚未完成时仍得到 0 exit code，可以运行
`pnpm release:audit:local`。

CI workflow 会先安装 Playwright Chromium，因为 release verification 里的 auth smoke 包含真实浏览器流程。

`pnpm test` 会运行 package-level unit tests。`pnpm format:check` 会验证仓库格式。`pnpm pack:check` 会验证 npm package tarballs 包含 CLI 需要的编译入口和生成应用 templates，把打包后的 tarballs 安装到临时 workspace，用打包后的 `create-shipstack` CLI 创建应用，用打包后的 `shipstack` CLI 安装 database 和 auth modules，验证模块文档链接，并运行 `shipstack doctor`。

### 可选 Cloudflare 临时部署 Smoke

当 Wrangler 尚未登录时，维护者仍然可以用 Cloudflare temporary deploy
flow 验证真实外部上传和 Worker runtime：

```sh
pnpm smoke:temporary-deploy
```

这个命令会创建 fresh 生成应用、安装依赖、运行生成应用检查、用
`wrangler deploy --temporary` 部署、在日志里隐藏 temporary account claim
URL，并通过生成应用里的 `pnpm verify:deployed` 检查已部署的 `/health`、
`/api/health` 和 `/api/v1/me` routes。

这个检查刻意不放进 `pnpm verify:release`，因为它依赖 Cloudflare 外部网络和
temporary account 服务。temporary deploy 成功是有价值的部署证据，但不能替代维护者真实
Cloudflare 账号下的手动部署检查。

## 下一步应补充什么

按这个顺序补测试：

1. 如果 CLI 行为变得更复杂，给底层 patch helper 增加 CLI 单元测试。
2. 使用维护者真实账号完成 Cloudflare 手动部署验证。
3. 在远端仓库确认 GitHub Actions workflow 可以通过。
4. 未来 schema 变化时补更多 D1 migration 边界场景。
5. 未来 Stripe、R2、API key 模块的模块级 smoke tests。

如果某个行为暂时不能自动化，就在引入它的模块文档附近写清楚手动验证路径。
