# ShipStack 中文文档

ShipStack 是一个开源、模块化、Cloudflare 优先的 TanStack Start SaaS 工程栈。

它的目标不是做一个“大而全”的静态模板，而是提供一条可执行、可验证、可维护的 SaaS 启动路径：从创建项目、配置 Cloudflare、接入数据库和认证，到后续增加支付、存储、API Key、Admin 和更多 recipes。

## 文档入口

- [项目设计](./PROJECT_DESIGN.md)
- [MVP 规格](./MVP_SPEC.md)
- [模块 Manifest 设计](./MODULE_MANIFEST.md)
- [路线图](./ROADMAP.md)
- [进度](./PROGRESS.md)
- [部署验证](./DEPLOYMENT.md)
- [Release Checklist](./RELEASE.md)
- [v0.1.0 Release Notes](./releases/v0.1.0.md)
- [架构决策](./DECISIONS.md)
- [法律与竞品边界](./LEGAL_BOUNDARIES.md)
- [开发环境](./DEVELOPMENT.md)
- [测试](./TESTING.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全策略](../../SECURITY.md)
- [Agent 指南](./AGENTS.md)

## 当前阶段

当前仓库已经是本地 `v0.1.0` MVP release candidate，包含基础模板、D1 + Drizzle 模块、Better Auth 模块、Stripe billing 模块、R2 storage 模块、API keys recipe、OpenAPI recipe、API rate limit recipe、受保护认证页面、生成应用 smoke tests、auth browser smoke checks、本地 npm publish dry-run，以及 CI/release workflows。可以运行 `pnpm release:audit` 查看当前 gate 状态。剩余外部 release gates 是运行真实 Cloudflare 部署验证、在远端仓库确认 GitHub Actions 通过，以及在远端仓库运行 npm publish workflow dry-run。

- TanStack Start
- Cloudflare Workers
- D1 + Drizzle
- Better Auth
- 受保护 Dashboard
- 基础 API 服务能力
- 清晰的环境变量和部署文档
- runtime integration tests
