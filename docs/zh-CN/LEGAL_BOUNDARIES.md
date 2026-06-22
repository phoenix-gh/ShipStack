# 法律与竞品边界

ShipStack 必须和付费或私有 boilerplate 项目保持独立。

## 核心规则

不要复制付费 boilerplate 的代码、私有仓库结构、专有资产、私有文档、命名、模板、提示词或实现细节。

ShipStack 可以从公开市场信号和公开文档中理解：

- 用户问题
- 功能类别
- setup 痛点
- 开源生态缺口
- 公开文档化的集成要求

但 ShipStack 的实现必须是原创的。

## TanStack 与 TanStarter

TanStack Start 和 TanStack Router 是 TanStack 的开源项目。

TanStarter 是另一个第三方付费 SaaS boilerplate。

ShipStack 可以使用开源 TanStack packages。ShipStack 不能复制 TanStarter 的私有代码、私有仓库、专有模板、付费资产或独特产品表达。

## 允许参考

允许：

- 官方开源项目文档
- 官方 package 文档
- 兼容 license 的开源仓库和示例
- Cloudflare、Stripe、Drizzle、Better Auth、TanStack 等 provider 官方文档
- 仅用于理解市场定位的公开产品页面

## 禁止参考

禁止：

- 付费或私有 boilerplate 的代码
- 私有仓库文件
- 泄漏源码
- 专有模板
- 仅客户可见的私有文档
- 复制营销文案
- 复制 UI layout 或 assets
- 从付费产品反向工程实现细节

## 实现标准

当某个功能和付费 boilerplate 重叠时，按第一性原理实现：

1. 从用户问题出发。
2. 查官方开源文档或 provider 文档。
3. 按 ShipStack 架构实现。
4. 写原创文档和示例。
5. 增加 tests 或 smoke checks。

## 命名标准

避免使用会和付费产品混淆的名称。

不要使用：

- TanStarter
- MkFast
- 暗示和付费 starter 有关联的名称

使用：

- ShipStack
- 明确的模块名，例如 `database-d1`、`auth-better-auth`、`billing-stripe`、`storage-r2`

