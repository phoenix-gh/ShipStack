# 进度

这个文件是 ShipStack 的工作进度看板。每当交付项状态变化时，都要更新它。

## 当前快照

状态：正在推进 `v0.1.0` MVP。

最近已验证：

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`
- `pnpm smoke`

最新提交：

- 运行 `git log --oneline -1` 查看。

## 阶段进度

| 阶段                              | 状态     | 说明                                                                                                                                   |
| --------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | 已完成   | 已有产品方向、MVP 范围、模块模型、agent guide 和法律边界。                                                                             |
| Phase 1: Minimal Runnable Starter | 基本完成 | 基础 TanStack Start + Cloudflare Workers 模板可构建，使用 Tailwind CSS，已有最小 UI primitives，通过 smoke tests，并已有 CI workflow。 |
| Phase 2: Database And Auth        | 基本完成 | 已有 D1、Drizzle、Better Auth、认证页面、session API、dashboard/account 服务端保护、auth migrations、account route 和 auth e2e smoke。 |
| Phase 3: CLI MVP                  | 基本完成 | 已有 `create`、`doctor`、`add database`、`add auth`、CLI 单元测试和模块感知 doctor 检查。                                              |
| Phase 4: Billing And Storage      | 未开始   | Stripe 和 R2 等基础路径稳定后再做。                                                                                                    |
| Phase 5: Recipes                  | 未开始   | Recipes 等 MVP 模块稳定后再做。                                                                                                        |
| Phase 6: Ecosystem                | 未开始   | Docs site、贡献指南、发布流程和 examples 后续再做。                                                                                    |

## MVP 验收进度

| 验收项                             | 状态 | 验证方式                                                 |
| ---------------------------------- | ---- | -------------------------------------------------------- |
| 依赖可以成功安装                   | 通过 | `pnpm smoke` 会安装生成应用。                            |
| 应用可以本地启动                   | 通过 | base 生成应用 runtime smoke 会启动 dev server。          |
| Home route 可以渲染                | 通过 | base 生成应用 runtime smoke 会检查 `/`。                 |
| Health route 返回成功              | 通过 | base 生成应用 runtime smoke 会检查 `/health`。           |
| Health API 返回成功                | 通过 | base 生成应用 runtime smoke 会检查 `/api/health`。       |
| 认证后的 `/api/v1/me` 返回当前用户 | 通过 | auth 生成应用 runtime smoke 会登录并检查 `/api/v1/me`。  |
| D1 migration 可以本地运行          | 通过 | database 生成应用 smoke 会运行 generate 和 local apply。 |
| 用户可以注册                       | 通过 | auth browser smoke 会通过生成 UI 注册。                  |
| 用户可以登录                       | 通过 | auth browser smoke 会通过生成 UI 重新登录。              |
| 匿名用户不能访问 dashboard         | 通过 | auth 生成应用 runtime smoke 会检查 dashboard redirect。  |
| 登录用户可以访问 dashboard         | 通过 | auth browser smoke 会在注册和登录后验证 dashboard。      |
| 应用可以构建到 Cloudflare Workers  | 通过 | `pnpm smoke` 会运行生成应用 build。                      |
| 部署文档足够手动执行               | 通过 | 已有生成应用和维护者部署检查清单。                       |
| 生成应用有匹配布局的 `AGENTS.md`   | 通过 | base template 已包含 `AGENTS.md`。                       |

## 测试进度

| 检查                         | 状态   | 命令             |
| ---------------------------- | ------ | ---------------- |
| Repository typecheck         | 通过   | `pnpm typecheck` |
| Repository build             | 通过   | `pnpm build`     |
| CLI behavior smoke           | 通过   | `pnpm smoke`     |
| Generated base app smoke     | 通过   | `pnpm smoke`     |
| Generated database app smoke | 通过   | `pnpm smoke`     |
| Generated auth app smoke     | 通过   | `pnpm smoke`     |
| Generated app lint           | 通过   | `pnpm smoke`     |
| CLI unit tests               | 通过   | `pnpm test`      |
| Runtime API tests            | 通过   | `pnpm smoke`     |
| Auth browser e2e tests       | 通过   | `pnpm smoke`     |
| D1 migration smoke           | 通过   | `pnpm smoke`     |
| Auth migration smoke         | 通过   | `pnpm smoke`     |
| CI workflow                  | 已添加 | GitHub Actions   |

## 下一优先级

1. 使用真实凭据运行 Cloudflare 手动部署验证。
2. 在远端仓库确认 GitHub Actions workflow 可以通过。
3. 在部署文档里增加手动 route checks。
4. 如果后续增加更多受保护页面，再抽出可复用 protected route helper。
5. 真实部署验证后，开始第一个 MVP 后模块。

## 更新规则

- 只有经过自动化检查或写明手动验证后，状态才能标为 `通过`。
- 代码存在但还没端到端验证时，用 `部分完成`。
- 行为变化时，尽量在同一个 commit 里更新这个文件。
- 详细设计变化放到 `PROJECT_DESIGN.md`，不要放在这里。
