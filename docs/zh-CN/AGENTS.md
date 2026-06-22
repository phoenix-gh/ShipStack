# ShipStack Agent 指南

本文告诉 AI coding agents 如何在 ShipStack 仓库和生成应用里工作。

## 项目使命

ShipStack 是一个开源、模块化、Cloudflare 优先的 TanStack Start SaaS 工程栈。

优先做能帮助用户创建、理解、验证和部署真实 SaaS 底座的改动。不要把项目做成宽泛 demo gallery。

## 当前阶段

仓库处于设计阶段。当前目标是走向最小可运行 starter：

- TanStack Start
- Cloudflare Workers
- D1 and Drizzle
- Better Auth
- 给 app 和 integration clients 使用的 API routes
- protected dashboard
- 清晰的环境变量处理
- deployment docs
- smoke tests

## 工程规则

- base starter 保持最小。
- 尽量把功能做成 modules 或 recipes。
- provider 边界要显式，不要隐藏在全局耦合里。
- 只有在能消除真实重复或保护 provider 边界时才引入新抽象。
- MVP 不添加大型无关 UI 系统、theme framework、AI demo 或 marketing pages。
- 生成代码要方便人类检查和 debug。
- 重要行为变化应包含 test、smoke check 或文档化的手动验证路径。

## 仓库约定

计划中的源仓库布局：

```text
apps/
packages/
templates/
recipes/
docs/
AGENTS.md
```

使用 `docs/PROJECT_DESIGN.md` 作为产品和架构方向的 source of truth。

使用 `docs/ROADMAP.md` 判断当前阶段应该做什么。

使用 `docs/MVP_SPEC.md` 判断第一版是否完成。

使用 `docs/MODULE_MANIFEST.md` 处理模块安装行为。

使用 `docs/DECISIONS.md` 理解已接受的架构取舍。

实现和付费或私有 boilerplate 重叠的功能前，先阅读 `docs/LEGAL_BOUNDARIES.md`。

## 生成应用约定

生成应用大致使用以下结构：

```text
src/
  components/
  config/
  db/
  features/
  features/api/
  lib/
  routes/
  routeTree.gen.ts
  styles/
drizzle/
public/
tests/
wrangler.jsonc
drizzle.config.ts
vite.config.ts
.env.example
AGENTS.md
```

Feature code 放在 `src/features/<feature>`。

共享 primitives 放在 `src/lib` 或 `src/components`。

Route files 保持轻薄。业务逻辑放入 feature modules。

外部 API helpers 放在 `src/features/api` 或 `src/lib/api`。

## 模块规则

新增模块时，需要定义或更新：

- 模块创建的文件
- package dependencies
- 环境变量
- Wrangler bindings
- database schema 或 migrations
- setup commands
- tests 或 smoke checks
- documentation

模块应保持幂等。重复安装模块不应该重复 routes、env vars、bindings 或 schema exports。

## Cloudflare 规则

- Cloudflare Workers 是默认 runtime。
- D1 是默认 database。
- R2 是默认 object storage。
- Wrangler configuration 要谨慎、可预测地 patch。
- build-time env、runtime secrets、local `.dev.vars` 和 public browser env 要分开文档化。
- 永远不要提交真实 secrets。

## Database 规则

- Drizzle schema 是 source of truth。
- 提交生成的 migrations。
- local 和 remote migration commands 保持区分。
- 用户拥有的资源 metadata 存数据库。
- 使用显式 relations 和可读 table names。

## Auth 规则

- Better Auth 是第一版 auth provider。
- 保持一个标准 server-side session helper。
- 受保护 server behavior 不信任 client-side auth state。
- Protected routes 使用共享 guard pattern。
- OAuth 可选，不应成为 local first run 的必需项。

## API 规则

- ShipStack 应能作为 Web、mobile、desktop、CLI 和 partner clients 的 backend。
- 外部 API 使用 `/api/v1` 版本化路由。
- 保持 `/api/health` 作为轻量 operational check。
- 使用一致的 JSON response 和 error envelopes。
- 可行时在 API responses 中包含 request ID。
- 不向 clients 泄漏内部 exception details。
- 用户身份从 session 或 API key 推导，绝不从客户端传入的 user ID 推导。
- CORS 默认收紧，并文档化 trusted client 配置。
- Validation 和 business logic 放在 feature modules，不直接塞进 route files。
- 安装 API Keys 模块后，API keys 用于 server-to-server、CLI 和第三方集成。
- 不要把 API keys 当移动 App 用户登录 token；native app user auth 需要明确 session 或 bearer-token 设计。

## Billing 规则

- Stripe 是第一版 billing provider。
- Billing state 必须通过 webhooks 确认。
- Webhook handlers 必须幂等。
- Paid feature access 调用 server-side entitlement helper。
- Product 和 price IDs 放在 config 或 env，不要写死在 route logic。

## Storage 规则

- R2 是第一版 storage provider。
- File metadata 存数据库。
- read、update、delete 前检查 ownership。
- 默认避免 public buckets。
- Upload size limits 明确。

## UI 规则

- 优先构建真实 app surface，而不是 marketing landing page。
- Dashboard UI 应安静、信息密度合适、实用。
- starter 存在后，遵循已有 component conventions。
- 不要给 operational pages 添加重装饰布局。

## 文档规则

- 文档围绕任务组织。
- setup steps 要包含 commands 和 expected results。
- 环境变量靠近引入它们的模块文档化。
- 行为或命令变化时更新文档。

## 测试规则

优先测试：

- generated project build
- CLI idempotency
- D1 migrations
- auth sign in and protected routes
- API health and authenticated API routes
- Stripe webhook fixtures
- R2 upload flows

如果暂时无法添加测试，在相关文档或最终报告里给出手动验证路径。

## 避免事项

- 不复制私有 boilerplate 的代码或结构。
- 不复制付费 boilerplate 的模板、专有资产、私有文档、营销文案、提示词或实现细节。
- 不暗示 ShipStack 和 TanStarter、MkFast 或其他付费 starter 有关联。
- MVP 路径跑通前不添加宽泛功能集。
- 不把 provider-specific assumptions 藏在 generic names 里。
- 不把 secrets 加到 committed files。
- 安装模块前，生成应用不依赖可选服务。
- 不更新 `docs/DECISIONS.md` 就不要改变架构决策。
