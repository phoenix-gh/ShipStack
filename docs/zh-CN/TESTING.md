# 测试

ShipStack 的测试应该证明生成出来的应用真的可用，而不只是证明仓库代码可以编译。

## 测试层级

### 仓库检查

普通代码变更提交前运行：

```sh
pnpm typecheck
pnpm build
```

`pnpm typecheck` 校验 monorepo 内的包。`pnpm build` 会产出 smoke test 需要执行的 CLI 包。

### 生成应用 Smoke Tests

修改模板、模块安装器、CLI 行为、包版本或生成应用脚本后，运行完整 smoke suite：

```sh
pnpm smoke
```

Smoke suite 会创建临时的真实应用，安装依赖，并运行应用级检查：

- `scripts/smoke/cli.mjs` 创建应用，并检查 CLI 错误、`doctor`、模块依赖顺序和重复安装模块。
- `scripts/smoke/base.mjs` 创建基础 TanStack Start 应用，运行 `pnpm install`、`pnpm test`、`pnpm lint`、`pnpm typecheck`，启动 dev server，检查 `/`、`/health`、`/api/health`、`/api/v1/me`、trusted API CORS、默认收紧的 CORS 行为、`pnpm build` 和 `pnpm deploy:dry-run`。
- `scripts/smoke/database.mjs` 创建应用，重复安装两次 D1 database 模块，验证 lint，生成 migration，用 Wrangler 本地应用 migration，然后运行同样的应用检查。
- `scripts/smoke/auth.mjs` 创建应用，安装 database 与 Better Auth 模块，重复安装两次 auth 模块，验证 lint，生成 auth migrations，用 Wrangler 本地应用 migrations，启动 dev server，验证匿名 dashboard redirect，登录后检查认证态 `/api/v1/me`，运行浏览器注册、退出、登录和 dashboard 检查，然后运行同样的应用检查。

Smoke 工作目录会创建在操作系统临时目录中。通过的运行会自动删除。失败的运行会保留并打印路径，方便检查生成项目。

### 持续集成

GitHub Actions 会在 push 和 pull request 时运行同样的项目级检查：

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm smoke
```

CI workflow 会先安装 Playwright Chromium，因为 auth smoke 包含真实浏览器流程。

`pnpm test` 会运行 package-level unit tests。`pnpm format:check` 会验证仓库格式。

## 下一步应补充什么

按这个顺序补测试：

1. 如果 CLI 行为变得更复杂，给底层 patch helper 增加 CLI 单元测试。
2. Cloudflare 手动部署验证。
3. 在远端仓库确认 GitHub Actions workflow 可以通过。
4. 未来 schema 变化时补更多 D1 migration 边界场景。
5. 未来 Stripe、R2、API key 模块的模块级 smoke tests。

如果某个行为暂时不能自动化，就在引入它的模块文档附近写清楚手动验证路径。
