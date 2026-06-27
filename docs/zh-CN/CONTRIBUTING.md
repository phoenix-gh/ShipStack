# 贡献指南

感谢你帮助 ShipStack 成为一个可靠的开源 SaaS starter。

## 范围

ShipStack 当前聚焦一个最小、可验证、Cloudflare-first 的 MVP：

- TanStack Start
- Cloudflare Workers
- D1 和 Drizzle
- Better Auth
- versioned API routes
- 生成应用 smoke tests
- 部署文档

在加入大量产品功能前，优先改进这条基础路径。

## 改代码前

请先阅读这些文档：

- [项目设计](./PROJECT_DESIGN.md)
- [MVP 规格](./MVP_SPEC.md)
- [路线图](./ROADMAP.md)
- [法律边界](./LEGAL_BOUNDARIES.md)
- [测试](./TESTING.md)
- [Release Checklist](./RELEASE.md)

不要复制私有 boilerplate、付费 starter templates、专有文档、营销文案或实现细节。

## 开发

安装依赖：

```sh
pnpm install
```

运行常规检查：

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

修改 templates、modules、CLI 行为、生成应用 scripts 或 package versions 后，运行生成应用 smoke tests：

```sh
pnpm smoke
```

面向 release 的改动，在合并前运行完整 release verification：

```sh
pnpm verify:release
```

可选外部部署 smoke：

```sh
pnpm smoke:temporary-deploy
```

这会使用 Cloudflare temporary account flow。它是有价值的证据，但不能替代真实账号部署验证。

## 贡献规则

- 保持 base starter 最小化。
- 功能尽量以 modules 或 recipes 形式加入。
- Route files 保持轻量；业务逻辑放进 feature modules。
- Cloudflare、auth、database、billing 和 storage provider assumptions 要保持显式。
- 行为变更需要包含 tests、smoke checks 或写明手动验证路径。
- 用户可见行为变化时，同步更新英文和中文文档。
- 永远不要提交真实 secrets。

## 安全问题

疑似漏洞不要创建公开 issue。请遵循 [Security Policy](../../SECURITY.md)。

## Commit 风格

使用简洁的 conventional-style commit message，例如：

```text
feat: add api key module manifest
fix: preserve wrangler bindings on install
test: cover auth module idempotency
docs: clarify cloudflare deployment
```

## Release Gates

打 `v0.1.0` tag 前，维护者应确认：

1. `pnpm verify:release` 通过。
2. `pnpm pack:check` 通过。
3. 本地 `pnpm publish:dry-run` 通过。
4. 如果批准 temporary deploy check，`pnpm smoke:temporary-deploy` 通过。
5. 已完成并记录真实 Cloudflare 账号部署。
6. 远端 GitHub Actions workflow 通过。
7. 远端 npm publish workflow dry-run 通过。

完整 release flow 见 [Release Checklist](./RELEASE.md)。
