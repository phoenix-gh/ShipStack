# ShipStack 路线图

## Phase 0: Design Foundation

状态：已完成。

- 定义产品定位
- 定义项目架构
- 定义模块系统
- 定义 AI agent guide
- 定义 MVP 范围

## Phase 1: Minimal Runnable Starter

目标：创建一个可以本地运行并部署到 Cloudflare Workers 的项目。

交付物：

- workspace setup
- base TanStack Start template
- Cloudflare Workers configuration
- Tailwind 和最小 UI primitives
- health route
- API health route
- basic dashboard route
- `.env.example`
- local dev docs
- deploy docs
- smoke test

退出标准：

- fresh clone 可以本地运行
- 生成 app 可以部署到 Cloudflare Workers
- CI 证明 template 可以 build

当前说明：本地生成应用 build 和 smoke path 已通过。真实 Cloudflare deploy pass 仍需要账号凭据。

## Phase 2: Database And Auth

目标：让 starter 能用于 authenticated apps。

交付物：

- D1 binding
- Drizzle schema 和 migrations
- migration commands
- Better Auth setup
- email/password auth
- optional Google OAuth docs
- protected dashboard
- account settings
- `/api/v1/me` session-authenticated endpoint
- auth tests

退出标准：

- 用户可以注册、登录、登出
- 受保护路由会 redirect anonymous users
- migration path 本地和远程都能工作

## Phase 3: CLI MVP

目标：把 starter 变成可重复使用的工具。

交付物：

- `create-shipstack`
- `shipstack doctor`
- `shipstack add database`
- `shipstack add auth`
- 生成应用的 `pnpm db:cf:create`
- 幂等 file operations
- CLI tests

退出标准：

- 用户可以通过 CLI 创建并验证项目
- 重复运行命令不会破坏 app
- 错误信息能说明下一步怎么做

当前说明：CLI create、doctor、database、auth 模块流程已通过本地 smoke 和单元测试。专用 Cloudflare 管理命令属于 MVP 后能力。

## Phase 4: Billing And Storage

目标：补齐最小 SaaS 闭环。

状态：本地通过。Stripe billing 和 R2 storage 已实现并通过本地验证。

交付物：

- Stripe checkout（本地完成）
- Stripe webhook handler（本地完成）
- subscription schema（本地完成）
- billing portal（本地完成）
- entitlement helper（本地完成）
- R2 storage provider（本地完成）
- file metadata table（本地完成）
- upload and delete flows（本地完成）
- billing and storage tests（本地完成）

退出标准：

- 已登录用户可以启动 checkout
- webhook fixture 可以更新 subscription state
- paid feature check 在 server-side 工作
- 已登录用户可以上传并管理文件

## Phase 5: Recipes

目标：通过 recipes 扩展，而不是膨胀 starter。

状态：第一批 recipes 本地通过。API keys、OpenAPI generation 和 API rate limiting 已实现并通过本地验证。

初始 recipes：

- API keys（本地完成）
- OpenAPI generation（本地完成）
- API rate limit（本地完成）
- TypeScript API SDK
- admin user management
- audit log
- rate limit
- teams
- Postgres adapter
- Polar billing

退出标准：

- API keys recipe 可通过 CLI 安装
- API keys recipe 文档说明 tradeoffs
- API keys recipe 包含 tests 或 smoke checks
- OpenAPI recipe 可通过 CLI 安装
- OpenAPI recipe 文档说明 tradeoffs
- OpenAPI recipe 包含 tests 或 smoke checks
- API rate limit recipe 可通过 CLI 安装
- API rate limit recipe 文档说明本地和生产边界
- API rate limit recipe 包含 tests 或 smoke checks

## Phase 6: Ecosystem

目标：成为可信的 Cloudflare-first SaaS 开源底座。

交付物：

- docs site
- example apps
- contribution guide
- module authoring guide
- community showcase
- release automation
- update guide

退出标准：

- 外部用户贡献 recipes
- 有真实上线 app 被列出
- releases 包含 migration notes
