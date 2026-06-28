# ShipStack 项目设计

## 1. 产品定位

ShipStack 是一个开源、模块化、Cloudflare 优先的 TanStack Start SaaS 工程栈。

它应该更像一个可靠的项目创建和维护系统，而不是一个静态代码模板：

```bash
pnpm create shipstack-app my-app
cd my-app
pnpm shipstack doctor
pnpm shipstack add auth
pnpm shipstack add billing --provider stripe
pnpm shipstack add storage --provider r2
pnpm shipstack deploy
```

第一版不需要实现所有命令，但整体架构要朝这个体验设计。

## 2. 目标用户

主要用户：

- 正在做小型 SaaS 的独立开发者
- 希望用 Cloudflare 控制成本和部署路径的开发者
- 想使用 TanStack Start 而不是 Next.js 的开发者
- 使用 Codex、Cursor、Claude Code 等 AI 编码工具的开发者
- 希望使用透明开源底座，而不是私有付费模板的小团队

次级用户：

- 高频启动 SaaS 项目的 agency
- 正在做 hosted service 的开源项目维护者
- 想学习 Cloudflare-native 全栈架构的开发者

## 3. 解决的问题

ShipStack 解决 SaaS 项目里重复出现的基础设施工作：

- 创建结构清晰的 TanStack Start 全栈应用
- 配置 Cloudflare Workers 部署
- 设置 D1 和 Drizzle migration
- 实现认证和受保护路由
- 提供给移动 App、桌面 App、CLI 和第三方集成使用的 API routes
- 接入 billing checkout、webhook 和订阅状态同步
- 上传文件到 R2，并在数据库里存储文件 metadata
- 创建 dashboard、settings、billing、API key 和基础 admin 页面
- 降低环境变量和 secrets 的配置混乱
- 让生成项目适合 AI coding agents 继续扩展
- 用测试证明 starter 在依赖更新后仍然可用

## 4. 非目标

第一版不要把 ShipStack 做成一个巨大的 all-in-one 产品模板。

MVP 不优先做：

- 重营销型 landing page 系统
- 主题市场
- AI demo
- newsletter 集成
- blog CMS
- 复杂团队和多租户
- 高级 RBAC
- 所有支付 provider
- 所有数据库 provider
- 可视化页面构建器
- no-code admin 定制

这些可以在核心路径稳定后作为 recipes 增加。

## 5. 设计原则

### 最小可运行优先

新项目应该用尽可能少的配置跑起来。可选服务只在安装对应模块时引入。

### Cloudflare 优先，但不只服务 Cloudflare

默认路径要深度支持 Workers、D1、R2 和 Wrangler。但 provider 相关逻辑要保持边界清楚，方便未来支持其他 adapter。

### 模块优先，而不是巨型模板

功能应该能按模块增减。用户如果只需要 auth 和 dashboard，就不应该被迫带上 billing、storage、newsletter 或 AI 代码。

### 用验证建立信任

每个核心模块都应该提供测试或 smoke check。项目要证明 auth、migration、webhook、upload、部署配置能工作。

### 默认适合 AI 协作

生成项目应该包含清晰的文件归属、扩展规则、模块约定和示例。AI agents 应该能沿着既有架构加功能，而不是重新发明结构。

### API-ready，但不 API-heavy

ShipStack 应该能作为 Web、移动 App、桌面 App、CLI 和第三方集成的后端服务。默认 API 面要小、版本化、可文档化、可保护。高级 API 平台能力应该作为模块或 recipes，而不是塞进基础应用。

### 选择朴素可维护的生产方案

优先使用稳定、容易排查的模式。生成项目应该在半夜出问题时也能看懂。

## 6. 仓库形态

ShipStack 源仓库最终应该同时包含 generator 和 starter templates。

```text
.
├── apps/
│   ├── docs/                    # 文档站
│   └── playground/              # 用于手动测试的生成应用
├── packages/
│   ├── create-shipstack/        # create 命令入口
│   ├── cli/                     # shipstack CLI
│   ├── core/                    # 模块注册表和共享工具
│   ├── config/                  # lint、tsconfig、test config
│   └── testing/                 # 生成项目测试 helpers
├── templates/
│   ├── base/                    # 最小 TanStack Start + Cloudflare 应用
│   └── modules/
│       ├── auth/
│       ├── database/
│       ├── billing-stripe/
│       ├── storage-r2/
│       ├── api-keys/
│       └── admin/
├── recipes/
│   ├── teams/
│   ├── audit-log/
│   ├── rate-limit/
│   ├── postgres/
│   └── polar-billing/
├── docs/
├── AGENTS.md
├── package.json
└── pnpm-workspace.yaml
```

生成出来的用户应用应该保持清晰常规：

```text
my-app/
├── src/
│   ├── components/
│   ├── config/
│   ├── db/
│   ├── features/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── dashboard/
│   │   ├── storage/
│   │   └── users/
│   ├── lib/
│   ├── routes/
│   ├── routeTree.gen.ts
│   └── styles/
├── drizzle/
│   └── migrations/
├── public/
├── tests/
│   ├── e2e/
│   └── integration/
├── wrangler.jsonc
├── drizzle.config.ts
├── vite.config.ts
├── package.json
├── .env.example
└── AGENTS.md
```

## 7. 模块系统

模块是一组可安装功能。每个模块应该声明：

- 要创建或 patch 的文件
- package dependencies
- 环境变量
- Wrangler bindings
- 数据库 schema 增量
- 安装后命令
- 测试
- 文档片段
- 和其他模块的冲突关系

概念上的 module manifest：

```ts
export interface ShipStackModule {
  id: string;
  name: string;
  description: string;
  dependencies?: string[];
  packages?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  env?: EnvVarSpec[];
  wrangler?: WranglerBindingSpec[];
  files?: FileOperation[];
  patches?: PatchOperation[];
  migrations?: MigrationSpec[];
  tests?: TestSpec[];
  docs?: DocSpec[];
}
```

第一版实现可以更简单，但方向应该保持一致。

## 8. 核心模块

### Base

创建最小应用：

- TanStack Start
- TanStack Router
- Cloudflare Workers adapter
- Tailwind CSS
- 最小 UI primitives
- base layout
- health route
- 环境变量加载
- Wrangler 配置
- GitHub Actions deploy workflow

### Database

增加 D1 和 Drizzle：

- D1 binding
- Drizzle client
- schema directory
- migrations directory
- local/remote migration scripts
- seed command
- database smoke test

### Auth

增加 Better Auth：

- email/password 注册和登录
- 可选 Google OAuth 配置
- session handling
- auth client/server helpers
- protected route guard
- dashboard route
- account settings page
- auth e2e tests

### API

增加外部 API 基础能力：

- `/api/health` route
- `/api/v1/*` route 约定
- JSON response/error envelope helpers
- session-authenticated API 示例
- 安装 API Keys 模块后的 API-key-authenticated 示例
- 可信 app clients 的 CORS 配置
- request ID helper
- API smoke tests

### Billing Stripe

增加 Stripe billing：

- product/price config
- checkout session 创建
- customer portal
- webhook route
- subscription table
- subscription state sync
- billing settings page
- webhook fixture tests

### Storage R2

增加 R2 upload：

- R2 binding
- storage provider interface
- upload route
- signed download 或 public access 策略
- user file metadata table
- upload UI
- file access tests

### API Keys

增加 API key 管理：

- key table
- 创建和撤销 key
- hash 存储
- scoped keys
- dashboard UI
- API auth middleware/helper
- API usage examples

### Admin

增加最小 admin：

- admin route group
- user list
- user detail
- subscription visibility
- role flag
- protected admin guard

## 9. CLI 设计

CLI 是 ShipStack 的关键差异化。

初始命令：

```bash
shipstack doctor
shipstack add <module>
shipstack db create
shipstack db migrate
shipstack db seed
shipstack cf init
shipstack cf create-r2
shipstack secrets sync
shipstack deploy
```

MVP 命令：

- `shipstack doctor`：检查 Node、包管理器、Wrangler、Cloudflare 登录、env files、D1/R2 bindings
- `shipstack add auth`：安装 auth 模块
- `shipstack add database`：安装 database 模块
- 生成应用的 `pnpm db:cf:create`：通过 Wrangler 创建 D1 database
- 生成应用的 migration scripts：运行 local 或 remote migration

MVP 后命令：

- `shipstack add api`：当 API 模块从 base starter 拆出后，安装外部 API 约定和 helpers
- `shipstack cf create-d1`：创建 D1 database 并 patch Wrangler 配置
- `shipstack db migrate`：运行 local 或 remote migration

CLI 应尽量幂等。重复运行命令时应该说明已有内容，而不是重复写入。

## 10. 环境变量策略

环境变量混乱是核心痛点之一。ShipStack 应明确区分：

- public browser variables
- build-time variables
- runtime Worker secrets
- local development variables
- provider resource IDs

生成文件：

- `.env.example`
- `.env.local.example`
- `.dev.vars.example`
- `docs/env.md`

规则：

- 不提交真实 secrets
- public variables 必须有明确前缀
- 生产 runtime secrets 使用 Wrangler secrets
- 文档说明哪些变量属于 GitHub Actions
- 尽可能从 module manifests 生成 env 文档

## 11. 数据库策略

D1 是默认数据库。

规则：

- Drizzle schema 是 source of truth
- 提交生成的 migrations
- local D1 和 remote D1 命令分开
- 用户数据表靠近 feature module，但通过 central schema index 导出
- 跨 feature relations 要显式并有文档

未来 adapter：

- Neon 或 Supabase Postgres
- Turso
- 用 adapter contract 测试模块

## 12. Auth 策略

Better Auth 是第一版 auth provider。

规则：

- auth 代码放在 `src/features/auth`
- route guards 小而可复用
- server-side session access 只有一个标准 helper
- client-side auth state 不重复替代 server truth
- 默认支持 email/password
- OAuth 可选并清楚文档化

## 13. Billing 策略

Stripe 是第一版 billing provider。

规则：

- billing state 通过 webhook 确认后存到本地
- 不信任客户端订阅状态
- webhook handlers 必须幂等
- product/price IDs 放在 config/env
- checkout creation 必须校验 authenticated user
- paid feature checks 调用 server-side entitlement helper

未来 provider：

- Polar
- Creem
- Lemon Squeezy

## 14. Storage 策略

R2 是第一版 storage provider。

规则：

- 文件 metadata 存数据库
- read/update/delete 前检查 user ownership
- 默认避免 public bucket
- upload size limits 明确
- delete 尽量同时删除 metadata 和 object

未来 provider：

- S3-compatible storage
- development-only local filesystem

## 15. 测试策略

测试是产品的一部分。

核心检查：

- provider interfaces 和 helpers 的 unit tests
- auth、database、API responses、billing webhooks、storage 的 integration tests
- sign in、dashboard access、billing page、file upload 的 Playwright tests
- CLI module installation 幂等性测试
- generated project smoke test in CI

仓库应该包含一个由当前 template 生成的 playground。CI 应该重新生成它并运行 smoke tests，防止模板悄悄失效。

## 16. 文档策略

文档应该围绕任务组织：

- quickstart
- local development
- Cloudflare 部署
- 环境变量
- 数据库 migrations
- authentication
- billing
- storage
- module authoring
- recipes
- AI agent guide

每个模块拥有自己的文档片段，最终文档可以从 module registry 组装。

## 17. 开源策略

开源项目应该提供足够价值，让用户不付费也能信任和使用：

- base app
- database
- auth
- Stripe billing
- R2 storage
- CLI setup
- tests
- core recipes

未来商业化可能包括：

- hosted setup dashboard
- managed updates
- advanced team/multi-tenant recipe
- admin pro module
- audit log module
- support contracts
- project migration services

在有真实用户和案例前，不急着商业化。

## 18. MVP 定义

MVP 完成时，用户应该可以：

1. 创建新项目
2. 本地运行
3. 创建并迁移 local D1 database
4. 注册和登录
5. 访问受保护 dashboard
6. 调用有文档的 health API endpoint
7. 部署到 Cloudflare Workers
8. 运行有文档的 smoke test

Stretch MVP：

1. 创建 Stripe checkout session
2. 接收 local webhook fixture
3. 同步 subscription state
4. 上传文件到 R2
5. 创建和撤销 API keys

## 19. 成功指标

早期信号：

- 用户能在 15 分钟内完成 quickstart
- 生成项目从 fresh clone 能通过 CI
- 来自 Cloudflare/TanStack 社区的 stars
- issue 更多是功能请求，而不是 setup 坏掉
- 至少 3 个真实项目从 ShipStack 启动

长期信号：

- 外部模块或 recipe 贡献
- 社区 examples
- recurring maintainers
- paid support 或 sponsorship 兴趣

## 20. API 服务设计

ShipStack 应该能作为这些客户端的 API backend：

- 移动 App
- 桌面 App
- 浏览器插件
- CLI tools
- partner integrations
- 不由同一个 TanStack Start 应用服务的另一个 frontend

基础应用应该包含小而清晰的 API foundation，而不是一个大型 API management platform。

### API 路由约定

使用版本化 API routes：

```text
/api/health
/api/v1/me
/api/v1/files
/api/v1/billing/subscription
```

规则：

- public operational checks 使用 `/api/health`
- 面向用户的 API 使用 `/api/v1`
- route handlers 保持轻薄
- request validation 放在 feature module 附近
- business logic 放在 `src/features/<feature>`
- shared API helpers 放在 `src/features/api` 或 `src/lib/api`

### 响应格式

外部 API 使用一致的 JSON envelope：

```json
{
  "data": {},
  "error": null,
  "requestId": "req_..."
}
```

失败响应：

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "requestId": "req_..."
}
```

不要向 API clients 泄漏内部 exception details。

### 认证模式

支持两种 API 认证模式：

- session auth：用于可以使用 cookie 的 first-party web/app clients
- API key auth：用于 CLI、server-to-server 和第三方集成

API keys recipe 会为 CLI、server-to-server 和第三方集成增加 bearer authentication。

不要把 API keys 当成移动 App 用户登录 token。Native app 用户认证应该有独立的 session 或 bearer-token 策略，并明确 refresh、撤销和安全存储规则。

### App Client 支持

对于移动或桌面 App，ShipStack 应支持：

- trusted clients 的 CORS allowlist
- cookie 不适用时的 bearer-token authentication
- 稳定的 API error codes
- versioned routes
- 通过 OpenAPI recipe 提供可选 OpenAPI generation

### 安全规则

- 不信任客户端传来的 user ID
- 从 session 或 API key 推导用户身份
- 校验 request bodies
- 在 feature services 中做 ownership checks
- CORS 默认收紧
- 在鼓励 public APIs 前，以 recipe 形式增加 rate limiting

### 未来 API 模块

可能的模块：

- `api-keys`
- `api-openapi`
- `api-rate-limit`
- `api-usage`
- `api-sdk-typescript`
- `api-webhooks`
