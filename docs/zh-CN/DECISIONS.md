# 架构决策

本文记录当前架构决策。实现过程中如果出现更强证据，可以重新讨论并更新。

## ADR 001: Cloudflare First

决策：ShipStack 默认使用 Cloudflare Workers、D1 和 R2。

理由：

- Cloudflare 对 indie SaaS 有成本和部署优势。
- TanStack Start + Cloudflare 的 starter 生态没有 Next.js + Vercel 那么拥挤。
- 真正难的地方主要是集成和 setup，ShipStack 可以把它自动化。

影响：

- 第一用户路径优先优化 Wrangler 和 Cloudflare resources。
- provider-specific 代码必须保持隔离，方便未来 adapter。

## ADR 002: 使用 TanStack Start

决策：ShipStack 第一版使用 TanStack Start。

理由：

- 它符合想走 Next.js 之外路线的目标用户。
- 它和 Vite、Cloudflare Workers 组合自然。
- 生态还年轻，production-oriented examples 有价值。

影响：

- MVP 不做 framework abstraction。
- route 和 server-function patterns 要保持一致并文档化。

## ADR 003: 模块优先，而不是巨型模板

决策：ShipStack 以可安装模块为中心设计。

理由：

- 巨型模板认知负担高，维护成本高。
- 用户应该按需安装 billing、storage、API keys、admin、teams 等能力。
- 模块让 recipes 和社区贡献更容易。

影响：

- Core code 应尽早定义 module metadata 和 file operations。
- 每个模块应拥有 env vars、docs、tests 和 setup checks。

## ADR 004: CLI 是一等产品界面

决策：ShipStack CLI 是核心差异化，而不是附属脚本。

理由：

- 手动 Cloudflare setup 是最大痛点之一。
- 好的 diagnostics 能提升项目信任感。
- 幂等命令能降低 setup 恐惧。

影响：

- CLI tests 很重要。
- 错误信息要具体、可执行。
- Resource creation commands 要安全 patch 配置。

## ADR 005: Better Auth First

决策：Better Auth 是第一版认证 provider。

理由：

- 它是现代 auth library，TypeScript 体验好。
- 它比 Next.js-specific 路线更适合 TanStack 生态。

影响：

- Auth 应通过小 helper 隔离，方便未来替换或升级。
- 生成 auth 示例要朴素、生产导向。

## ADR 006: Stripe First

决策：Stripe 是第一版 billing provider。

理由：

- Stripe 在 SaaS starter 里使用广泛，也是用户预期。
- Webhooks、checkout、customer portal 覆盖常见付费产品闭环。

影响：

- Billing provider code 要隔离。
- Subscription state 必须通过 webhooks 验证，不能信任 client assumptions。

## ADR 007: 测试是产品的一部分

决策：ShipStack modules 必须包含验证路径。

理由：

- Boilerplates 常常会悄悄过期。
- 用户需要相信 auth、migrations、webhooks 和 storage 仍然可用。

影响：

- CI 应 build 和 test 生成项目。
- 模块行为变化时要更新 smoke tests。
