# 进度

这个文件是 ShipStack 的工作进度看板。每当交付项状态变化时，都要更新它。

## 当前快照

状态：本地 `v0.1.0` MVP release candidate。真实 Cloudflare 部署和远端 CI 验证仍待完成。

当前 workspace 的外部验证状态：

- `pnpm dlx wrangler whoami` 显示 Wrangler 尚未登录。
- `pnpm smoke:temporary-deploy` 已通过 Cloudflare temporary account flow。
- `git remote -v` 没有配置 remote，因此当前 workspace 无法检查远端 GitHub Actions。

最近已验证：

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`
- `pnpm smoke`
- `pnpm verify:release`

最新提交：

- 运行 `git log --oneline -1` 查看。

## 阶段进度

| 阶段                              | 状态     | 说明                                                                                                                                           |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | 已完成   | 已有产品方向、MVP 范围、模块模型、agent guide 和法律边界。                                                                                     |
| Phase 1: Minimal Runnable Starter | 本地通过 | 基础 TanStack Start + Cloudflare Workers 模板可构建，使用 Tailwind CSS，已有最小 UI primitives，通过 smoke tests，并已有 CI/deploy workflows。 |
| Phase 2: Database And Auth        | 本地通过 | 已有 D1、Drizzle、Better Auth、认证页面、session API、可复用 protected route guards、auth migrations、account route 和 auth e2e smoke。        |
| Phase 3: CLI MVP                  | 本地通过 | 已有 `create`、`doctor`、`add database`、`add auth`、CLI 单元测试和模块感知 doctor 检查。                                                      |
| Phase 4: Billing And Storage      | 未开始   | Stripe 和 R2 等基础路径稳定后再做。                                                                                                            |
| Phase 5: Recipes                  | 未开始   | Recipes 等 MVP 模块稳定后再做。                                                                                                                |
| Phase 6: Ecosystem                | 未开始   | Docs site、贡献指南、发布流程和 examples 后续再做。                                                                                            |

## MVP 验收进度

| 验收项                                | 状态 | 验证方式                                                          |
| ------------------------------------- | ---- | ----------------------------------------------------------------- |
| 依赖可以成功安装                      | 通过 | `pnpm smoke` 会安装生成应用。                                     |
| 应用可以本地启动                      | 通过 | base 生成应用 runtime smoke 会启动 dev server。                   |
| Home route 可以渲染                   | 通过 | base 生成应用 runtime smoke 会检查 `/`。                          |
| Health route 返回成功                 | 通过 | base 生成应用 runtime smoke 会检查 `/health`。                    |
| Health API 返回成功                   | 通过 | base 生成应用 runtime smoke 会检查 `/api/health`。                |
| Trusted API CORS 默认保持收紧         | 通过 | base 生成应用 runtime smoke 会检查 trusted 和 untrusted origins。 |
| 认证后的 `/api/v1/me` 返回当前用户    | 通过 | auth 生成应用 runtime smoke 会登录并检查 `/api/v1/me`。           |
| D1 migration 可以本地运行             | 通过 | database 生成应用 smoke 会运行 generate 和 local apply。          |
| 用户可以注册                          | 通过 | auth browser smoke 会通过生成 UI 注册。                           |
| 用户可以登录                          | 通过 | auth browser smoke 会通过生成 UI 重新登录。                       |
| 匿名用户不能访问 dashboard            | 通过 | auth 生成应用 runtime smoke 会检查 dashboard redirect。           |
| 登录用户可以访问 dashboard            | 通过 | auth browser smoke 会在注册和登录后验证 dashboard。               |
| 应用可以构建到 Cloudflare Workers     | 通过 | `pnpm smoke` 会运行生成应用 build。                               |
| Worker deploy bundle 通过本地 dry-run | 通过 | base 生成应用 smoke 会运行 `pnpm deploy:dry-run`。                |
| 生成应用包含 CI 和 deploy workflows   | 通过 | base template 包含 CI 和手动 Cloudflare deploy workflows。        |
| 部署文档足够手动执行                  | 通过 | 已有生成应用和维护者部署检查清单。                                |
| 生成应用有匹配布局的 `AGENTS.md`      | 通过 | base template 和已安装模块会提供 `AGENTS.md` 指引。               |

## 测试进度

| 检查                         | 状态   | 命令                          |
| ---------------------------- | ------ | ----------------------------- |
| Repository typecheck         | 通过   | `pnpm typecheck`              |
| Repository build             | 通过   | `pnpm build`                  |
| CLI behavior smoke           | 通过   | `pnpm smoke`                  |
| Generated base app smoke     | 通过   | `pnpm smoke`                  |
| Generated database app smoke | 通过   | `pnpm smoke`                  |
| Generated auth app smoke     | 通过   | `pnpm smoke`                  |
| Generated app lint           | 通过   | `pnpm smoke`                  |
| Wrangler deploy dry-run      | 通过   | `pnpm smoke`                  |
| Cloudflare 临时部署          | 通过   | `pnpm smoke:temporary-deploy` |
| CLI unit tests               | 通过   | `pnpm test`                   |
| Runtime API tests            | 通过   | `pnpm smoke`                  |
| API CORS smoke               | 通过   | `pnpm smoke`                  |
| Auth browser e2e tests       | 通过   | `pnpm smoke`                  |
| D1 migration smoke           | 通过   | `pnpm smoke`                  |
| Auth migration smoke         | 通过   | `pnpm smoke`                  |
| 模块 AGENTS 指引             | 通过   | `pnpm test`, `pnpm smoke`     |
| CI workflow                  | 已添加 | GitHub Actions                |
| Release verification command | 通过   | `pnpm verify:release`         |
| v0.1.0 release notes         | 已添加 | `docs/releases`               |

## 下一优先级

1. 使用真实凭据运行 Cloudflare 手动部署验证。
2. 在远端仓库确认 GitHub Actions workflow 可以通过。
3. 真实部署验证后，开始第一个 MVP 后模块。

## 更新规则

- 只有经过自动化检查或写明手动验证后，状态才能标为 `通过`。
- 代码存在但还没端到端验证时，用 `部分完成`。
- 行为变化时，尽量在同一个 commit 里更新这个文件。
- 详细设计变化放到 `PROJECT_DESIGN.md`，不要放在这里。
