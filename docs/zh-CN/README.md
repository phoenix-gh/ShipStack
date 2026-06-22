# ShipStack 中文文档

ShipStack 是一个开源、模块化、Cloudflare 优先的 TanStack Start SaaS 工程栈。

它的目标不是做一个“大而全”的静态模板，而是提供一条可执行、可验证、可维护的 SaaS 启动路径：从创建项目、配置 Cloudflare、接入数据库和认证，到后续增加支付、存储、API Key、Admin 和更多 recipes。

## 文档入口

- [项目设计](./PROJECT_DESIGN.md)
- [MVP 规格](./MVP_SPEC.md)
- [模块 Manifest 设计](./MODULE_MANIFEST.md)
- [路线图](./ROADMAP.md)
- [架构决策](./DECISIONS.md)
- [法律与竞品边界](./LEGAL_BOUNDARIES.md)
- [开发环境](./DEVELOPMENT.md)
- [Agent 指南](./AGENTS.md)

## 当前阶段

当前仓库处于设计阶段。下一步目标是实现 `v0.1.0` 最小可运行 starter：

- TanStack Start
- Cloudflare Workers
- D1 + Drizzle
- Better Auth
- 受保护 Dashboard
- 基础 API 服务能力
- 清晰的环境变量和部署文档
- smoke tests
