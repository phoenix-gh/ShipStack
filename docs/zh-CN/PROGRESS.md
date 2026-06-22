# 进度

这个文件是 ShipStack 的工作进度看板。每当交付项状态变化时，都要更新它。

## 当前快照

状态：正在推进 `v0.1.0` MVP。

最近已验证：

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke`

最新提交：

- 运行 `git log --oneline -1` 查看。

## 阶段进度

| 阶段                              | 状态     | 说明                                                                                                                                          |
| --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | 已完成   | 已有产品方向、MVP 范围、模块模型、agent guide 和法律边界。                                                                                    |
| Phase 1: Minimal Runnable Starter | 基本完成 | 基础 TanStack Start + Cloudflare Workers 模板可构建，并通过生成应用 smoke tests。CI 和最终 UI primitive 选择还未完成。                        |
| Phase 2: Database And Auth        | 进行中   | 已有 D1、Drizzle、Better Auth、认证页面、session API、dashboard/account 服务端保护、auth migrations 和 account route。还需要 auth e2e tests。 |
| Phase 3: CLI MVP                  | 进行中   | 已有 `create`、`doctor`、`add database` 和 `add auth`。还需要 CLI 单元测试和更强的 doctor 检查。                                              |
| Phase 4: Billing And Storage      | 未开始   | Stripe 和 R2 等基础路径稳定后再做。                                                                                                           |
| Phase 5: Recipes                  | 未开始   | Recipes 等 MVP 模块稳定后再做。                                                                                                               |
| Phase 6: Ecosystem                | 未开始   | Docs site、贡献指南、发布流程和 examples 后续再做。                                                                                           |

## MVP 验收进度

| 验收项                             | 状态     | 验证方式                                                 |
| ---------------------------------- | -------- | -------------------------------------------------------- |
| 依赖可以成功安装                   | 通过     | `pnpm smoke` 会安装生成应用。                            |
| 应用可以本地启动                   | 通过     | base 生成应用 runtime smoke 会启动 dev server。          |
| Home route 可以渲染                | 通过     | base 生成应用 runtime smoke 会检查 `/`。                 |
| Health route 返回成功              | 未自动化 | 路由已存在，但还需要 runtime 检查。                      |
| Health API 返回成功                | 通过     | base 生成应用 runtime smoke 会检查 `/api/health`。       |
| 认证后的 `/api/v1/me` 返回当前用户 | 通过     | auth 生成应用 runtime smoke 会登录并检查 `/api/v1/me`。  |
| D1 migration 可以本地运行          | 通过     | database 生成应用 smoke 会运行 generate 和 local apply。 |
| 用户可以注册                       | 通过     | auth browser smoke 会通过生成 UI 注册。                  |
| 用户可以登录                       | 通过     | auth browser smoke 会通过生成 UI 重新登录。              |
| 匿名用户不能访问 dashboard         | 通过     | auth 生成应用 runtime smoke 会检查 dashboard redirect。  |
| 登录用户可以访问 dashboard         | 通过     | auth browser smoke 会在注册和登录后验证 dashboard。      |
| 应用可以构建到 Cloudflare Workers  | 通过     | `pnpm smoke` 会运行生成应用 build。                      |
| 部署文档足够手动执行               | 部分完成 | 已有基础文档；还需要完整手动 deploy pass。               |
| 生成应用有匹配布局的 `AGENTS.md`   | 通过     | base template 已包含 `AGENTS.md`。                       |

## 测试进度

| 检查                         | 状态 | 命令             |
| ---------------------------- | ---- | ---------------- |
| Repository typecheck         | 通过 | `pnpm typecheck` |
| Repository build             | 通过 | `pnpm build`     |
| CLI behavior smoke           | 通过 | `pnpm smoke`     |
| Generated base app smoke     | 通过 | `pnpm smoke`     |
| Generated database app smoke | 通过 | `pnpm smoke`     |
| Generated auth app smoke     | 通过 | `pnpm smoke`     |
| CLI unit tests               | 缺失 | 未来             |
| Runtime API tests            | 通过 | `pnpm smoke`     |
| Auth browser e2e tests       | 通过 | `pnpm smoke`     |
| D1 migration smoke           | 通过 | `pnpm smoke`     |
| Auth migration smoke         | 通过 | `pnpm smoke`     |

## 下一优先级

1. 增加 Cloudflare 手动部署验证。
2. 增加 typecheck/build/smoke 的 CI workflow。
3. 增加 health page runtime check，或者移除独立 health route 验收项。
4. 如果 patch helper 变复杂，再补更底层的 CLI 单元测试。
5. 如果后续增加更多受保护页面，再抽出可复用 protected route helper。

## 更新规则

- 只有经过自动化检查或写明手动验证后，状态才能标为 `通过`。
- 代码存在但还没端到端验证时，用 `部分完成`。
- 行为变化时，尽量在同一个 commit 里更新这个文件。
- 详细设计变化放到 `PROJECT_DESIGN.md`，不要放在这里。
