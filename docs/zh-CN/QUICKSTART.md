# 快速开始

用这份指南创建 ShipStack 应用、本地运行、安装 MVP 模块，并验证结果。

## 创建应用

Packages 发布后，可以使用 package create 命令：

```sh
pnpm create shipstack my-app
cd my-app
pnpm install
pnpm dev
```

在首次发布前，如果从当前仓库本地试用，先构建 packages，再运行本地 create 入口：

```sh
pnpm install
pnpm build
node packages/create-shipstack/dist/cli.js my-app
cd my-app
pnpm install
pnpm dev
```

打开 dev server 打印的本地 URL。基础应用包含：

- `/`
- `/health`
- `/api/health`
- `/api/v1/me`
- dashboard route
- Cloudflare Workers 配置
- 生成应用 CI 和 deploy workflows
- 生成应用 `AGENTS.md`

## 添加 MVP 模块

按依赖顺序安装模块：

```sh
shipstack add database
shipstack add auth
shipstack add billing
shipstack add storage
shipstack add api-keys
shipstack add openapi
shipstack add api-rate-limit
pnpm install
```

如果 packages 还没有全局安装、正在从当前仓库测试，可以在生成应用目录里运行本地 CLI：

```sh
node ../packages/cli/dist/cli.js add database
node ../packages/cli/dist/cli.js add auth
node ../packages/cli/dist/cli.js add billing
node ../packages/cli/dist/cli.js add storage
node ../packages/cli/dist/cli.js add api-keys
node ../packages/cli/dist/cli.js add openapi
node ../packages/cli/dist/cli.js add api-rate-limit
pnpm install
```

## 配置本地环境

运行 auth 或 integration modules 前，复制示例环境文件：

```sh
cp .env.example .env.local
cp .dev.vars.example .dev.vars
```

本地只使用开发值。不要提交真实 secrets。

## 生成并应用本地 Migrations

数据库相关模块使用 Drizzle schema 和 Cloudflare D1：

```sh
pnpm db:generate
pnpm openapi:generate
pnpm db:cf:migrate:local
```

`pnpm openapi:generate` 只在安装 OpenAPI recipe 或修改 API route 描述后需要运行。

## 验证应用

运行生成应用检查：

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm deploy:dry-run
```

本地 dev server 启动后，验证 runtime routes：

```sh
pnpm verify:deployed http://127.0.0.1:<port>
```

把 `<port>` 替换成 dev server 端口。

## 后续部署

准备使用真实 Cloudflare 账号部署时，阅读部署指南：

- [部署验证](./DEPLOYMENT.md)
- 生成应用里的 `docs/deployment.md`

当前项目已在 `docs/RELEASE_EVIDENCE.md` 记录真实 Cloudflare 部署验证、远端
GitHub Actions 验证，以及远端 npm publish workflow dry-run 的通过证据。
