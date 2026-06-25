# MVP 规格

本文定义 ShipStack 的第一个可用版本。

## MVP 承诺

开发者可以创建一个 TanStack Start 应用，本地运行，注册登录，访问受保护 dashboard，迁移 D1 数据库，并部署到 Cloudflare Workers，同时不需要猜测项目结构。

## 范围内

### Base App

- TanStack Start app
- TanStack Router 文件路由
- Cloudflare Workers runtime target
- Tailwind CSS
- 最小组件 primitives
- home route
- health route
- health API route
- dashboard shell
- TypeScript strict mode
- lint 和 format commands

### Database

- Cloudflare D1 binding
- Drizzle config
- schema entrypoint
- migrations directory
- migration scripts
- local development database path
- database smoke test

### Auth

- Better Auth setup
- email/password 注册
- email/password 登录
- sign out
- current session helper
- protected dashboard route
- account settings route
- auth e2e test

### API Foundation

- `/api/health`
- `/api/v1/me` session-authenticated 示例
- shared JSON response helper
- shared JSON error helper
- request ID helper
- trusted app clients 的默认收紧 CORS helper
- API smoke test

### Billing Module

- `shipstack add billing`
- Stripe Checkout session route
- Stripe Billing Portal route
- Stripe webhook route，并支持 idempotent event handling
- 通过 Drizzle 管理 subscription schema 和 migrations
- server-side billing status 和 entitlement helpers
- billing smoke test

### Storage Module

- `shipstack add storage`
- Cloudflare R2 binding
- 通过 Drizzle 管理 file metadata schema 和 migrations
- session-authenticated file upload、list、download 和 delete routes
- 文件访问前检查 ownership
- storage smoke test

### API Keys Recipe

- `shipstack add api-keys`
- 在 D1 中保存 hashed API key
- session-managed key 创建、列表和撤销 routes
- 为外部 API clients 支持 bearer API key
- 可复用 request identity helper，支持 session 或 API key auth
- API keys smoke test

### Deployment

- `wrangler.jsonc`
- Cloudflare Workers build command
- local dev command
- deploy command
- GitHub Actions workflow
- deployment documentation

### Environment

- `.env.example`
- `.dev.vars.example`
- 环境变量文档
- 明确区分 local vars、public vars、build-time vars 和 runtime secrets

### AI Agent Support

- 生成项目包含 `AGENTS.md`
- 文档化 feature layout
- 文档化 routes、db schema、auth 和 Cloudflare bindings 的扩展规则

## 范围外

- OpenAPI generation
- public API rate limiting
- generated SDKs
- admin panel
- team accounts
- landing page builder
- newsletter
- blog CMS
- AI demos
- 多数据库 provider
- 多部署 provider

这些能力重要，但应在基础路径稳定后再加入。

## 用户路径

目标流程：

```bash
pnpm create shipstack my-app
cd my-app
pnpm install
shipstack doctor
shipstack add database
shipstack add auth
shipstack add billing
shipstack add storage
shipstack add api-keys
pnpm db:generate
pnpm db:cf:migrate:local
pnpm dev
pnpm lint
pnpm test
pnpm deploy
```

具体命令可以在实现过程中调整，但首次使用体验要保持短而清楚。

## 验收标准

MVP 完成时，fresh clone 或生成项目必须满足：

- dependencies 成功安装
- app 可以本地启动
- home route 正常渲染
- health route 返回成功
- health API 返回成功
- authenticated `/api/v1/me` 返回当前用户
- D1 migration 可以本地运行
- 用户可以注册
- 用户可以登录
- 未登录用户不能访问 dashboard
- 已登录用户可以访问 dashboard
- app 可以 build 到 Cloudflare Workers
- 部署文档足够完整，可以手动跟随
- 生成的 `AGENTS.md` 存在，并匹配项目结构

## 手动验证清单

在宣布 MVP 完成前：

1. 创建 fresh app。
2. 安装 dependencies。
3. 复制 example env files。
4. 运行 local migration。
5. 启动 dev server。
6. 创建账号。
7. 登出。
8. 再次登录。
9. 访问 dashboard。
10. 运行 tests。
11. build for Workers。
12. 部署到真实 Cloudflare account，或记录为什么没有部署。

## 第一版 Release Tag

第一个 MVP release 使用 `v0.1.0`。

Release notes 应包含：

- supported Node version
- supported package manager
- required Cloudflare setup
- known limitations
- next planned modules
