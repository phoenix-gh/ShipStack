# 进度

这个文件是 ShipStack 的工作进度看板。每当交付项状态变化时，都要更新它。

## 当前快照

状态：正在推进 `v0.1.0` MVP。

最近已验证：

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke`

最新里程碑提交：

- `64e4d3c test: add generated app smoke tests`

## 阶段进度

| 阶段                              | 状态     | 说明                                                                                                                   |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | 已完成   | 已有产品方向、MVP 范围、模块模型、agent guide 和法律边界。                                                             |
| Phase 1: Minimal Runnable Starter | 基本完成 | 基础 TanStack Start + Cloudflare Workers 模板可构建，并通过生成应用 smoke tests。CI 和最终 UI primitive 选择还未完成。 |
| Phase 2: Database And Auth        | 进行中   | 已有 D1、Drizzle、Better Auth、认证页面、session API 和 account route。还需要服务端保护行为和 auth e2e tests。         |
| Phase 3: CLI MVP                  | 进行中   | 已有 `create`、`doctor`、`add database` 和 `add auth`。还需要 CLI 单元测试和更强的 doctor 检查。                       |
| Phase 4: Billing And Storage      | 未开始   | Stripe 和 R2 等基础路径稳定后再做。                                                                                    |
| Phase 5: Recipes                  | 未开始   | Recipes 等 MVP 模块稳定后再做。                                                                                        |
| Phase 6: Ecosystem                | 未开始   | Docs site、贡献指南、发布流程和 examples 后续再做。                                                                    |

## MVP 验收进度

| 验收项                             | 状态     | 验证方式                                              |
| ---------------------------------- | -------- | ----------------------------------------------------- |
| 依赖可以成功安装                   | 通过     | `pnpm smoke` 会安装生成应用。                         |
| 应用可以本地启动                   | 未自动化 | 需要 runtime smoke 或手动 dev-server 检查。           |
| Home route 可以渲染                | 未自动化 | 需要 runtime smoke 或浏览器检查。                     |
| Health route 返回成功              | 未自动化 | 路由已存在，但还需要 runtime 检查。                   |
| Health API 返回成功                | 未自动化 | 路由已存在，但还需要 runtime API 检查。               |
| 认证后的 `/api/v1/me` 返回当前用户 | 部分完成 | auth 模块安装后路由存在；还需要认证态 runtime test。  |
| D1 migration 可以本地运行          | 未自动化 | migration 命令已存在；还需要 local migration smoke。  |
| 用户可以注册                       | 部分完成 | 已有 auth 页面和 Better Auth route；还需要 e2e test。 |
| 用户可以登录                       | 部分完成 | 已有 auth 页面和 Better Auth route；还需要 e2e test。 |
| 匿名用户不能访问 dashboard         | 部分完成 | dashboard 已感知 session；还需要服务端 guard。        |
| 登录用户可以访问 dashboard         | 部分完成 | dashboard UI 支持 session 状态；还需要 e2e test。     |
| 应用可以构建到 Cloudflare Workers  | 通过     | `pnpm smoke` 会运行生成应用 build。                   |
| 部署文档足够手动执行               | 部分完成 | 已有基础文档；还需要完整手动 deploy pass。            |
| 生成应用有匹配布局的 `AGENTS.md`   | 通过     | base template 已包含 `AGENTS.md`。                    |

## 测试进度

| 检查                         | 状态 | 命令             |
| ---------------------------- | ---- | ---------------- |
| Repository typecheck         | 通过 | `pnpm typecheck` |
| Repository build             | 通过 | `pnpm build`     |
| Generated base app smoke     | 通过 | `pnpm smoke`     |
| Generated database app smoke | 通过 | `pnpm smoke`     |
| Generated auth app smoke     | 通过 | `pnpm smoke`     |
| CLI unit tests               | 缺失 | 计划中           |
| Runtime API tests            | 缺失 | 计划中           |
| Auth browser e2e tests       | 缺失 | 计划中           |
| D1 migration smoke           | 缺失 | 计划中           |

## 下一优先级

1. 增加共享的服务端 route guard，完成 dashboard 保护行为。
2. 增加 `/`、`/api/health` 和 `/api/v1/me` 的 runtime smoke tests。
3. 增加 create/add/doctor 和幂等性的 CLI 单元测试。
4. 增加 D1 local migration 验证。
5. 增加 auth browser e2e tests。

## 更新规则

- 只有经过自动化检查或写明手动验证后，状态才能标为 `通过`。
- 代码存在但还没端到端验证时，用 `部分完成`。
- 行为变化时，尽量在同一个 commit 里更新这个文件。
- 详细设计变化放到 `PROJECT_DESIGN.md`，不要放在这里。
