# 进度

这个文件是 ShipStack 的工作进度看板。每当交付项状态变化时，都要更新它。

## 当前快照

状态：`v0.1.0` MVP release candidate。本地验证、远端 CI、真实 Cloudflare
部署、远端 npm publish workflow dry-run，以及真实 npm 发布都已验证。

当前 workspace 的外部验证状态：

- `pnpm dlx wrangler whoami` 显示 Wrangler 已登录。不要提交 Cloudflare
  account IDs 或 tokens。
- `pnpm smoke:temporary-deploy` 之前通过过 Cloudflare temporary account flow，
  但 2026-06-24 最新一次尝试在上传前因 Wrangler `fetch failed` 网络错误失败。
- 2026-06-30 最新一次针对 auth 的本地 smoke 已在稳定 protected-route 浏览器
  session reset flow 后通过 `node scripts/smoke/auth.mjs`。
- 2026-06-29 最新一次远端 GitHub Actions CI 已在 `master` 上通过
  `pnpm verify:release`：
  https://github.com/phoenix-gh/ShipStack/actions/runs/28371065475
- 2026-06-28 最新一次真实 Cloudflare 部署验证已通过：
  https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
- 2026-06-28 最新一次远端 npm publish workflow dry-run 已对
  `@shipstack-dev/core`、`@shipstack-dev/cli` 和 `create-shipstack-app` 通过：
  https://github.com/phoenix-gh/ShipStack/actions/runs/28320946840
- 2026-06-30 最新一次正式 npm publish workflow 已通过 `pnpm verify:release`，
  并以 npm provenance 发布 `@shipstack-dev/core`、`@shipstack-dev/cli` 和
  `create-shipstack-app` 的 `0.1.0-alpha.1`：
  https://github.com/phoenix-gh/ShipStack/actions/runs/28456891005
- 2026-06-30 最新一次 npm registry 验证已确认三个 packages 都存在，且 `next`
  dist-tag 指向 `0.1.0-alpha.1`。`latest` dist-tag 仍指向
  `0.1.0-alpha.0`，直到拥有有效 npm auth 的 maintainer 移动它。
- 2026-06-30 最新一次 published-alpha 首次运行检查发现：
  `create-shipstack-app@0.1.0-alpha.0` 生成的 app 没有本地 `shipstack`
  binary。手动添加 `@shipstack-dev/cli@0.1.0-alpha.0` 后，模块安装、生成应用
  lint、tests、typecheck、build、本地 D1 migration、OpenAPI generation 和
  Workers deploy dry-run 已通过。template 现在会为下一次 release 写入兼容的 CLI
  prerelease range。
- 2026-06-30 已创建 `v0.1.0-alpha.0` Git tag 和 GitHub prerelease：
  https://github.com/phoenix-gh/ShipStack/releases/tag/v0.1.0-alpha.0
- 2026-06-30 已创建 `v0.1.0-alpha.1` Git tag 和 GitHub prerelease：
  https://github.com/phoenix-gh/ShipStack/releases/tag/v0.1.0-alpha.1
- 2026-06-30 已通过 published `@next` 首次运行检查：
  `pnpm create shipstack-app@next alpha1-next-app`、`pnpm install` 和
  `pnpm exec shipstack doctor` 都可在不手动添加 CLI 的情况下运行。
- 2026-06-30 最新一次本地 release audit 已在 `pnpm verify:local` 中通过。
- 2026-06-28 最新一次本地 npm publish dry-run 已对 `@shipstack-dev/core`、
  `@shipstack-dev/cli` 和 `create-shipstack-app` 通过 `pnpm publish:dry-run`。
- 2026-06-28 最新一次 `pnpm smoke` 在安装 `bubblewrap` 后通过，覆盖 recipe
  installer next-step 输出、base 生成应用的 `wrangler deploy --dry-run`、本地
  D1 migrations、浏览器 auth smoke，以及 database、auth、billing、storage、
  API keys、OpenAPI、API rate limiting 的模块 smoke tests。
- `pnpm smoke:temporary-deploy` 仍需要维护者明确批准后才能重跑，因为它会把
  生成应用代码上传到 Cloudflare temporary deployment 服务。
- `git remote -v` 已配置为 `https://github.com/phoenix-gh/ShipStack.git`。

最近已验证：

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`
- `pnpm smoke`
- `pnpm pack:check`
- `pnpm verify:local`
- `pnpm verify:release`
- `pnpm publish:dry-run`

最新提交：

- 运行 `git log --oneline -1` 查看。

## 阶段进度

| 阶段                              | 状态     | 说明                                                                                                                                           |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0: Design Foundation        | 已完成   | 已有产品方向、MVP 范围、模块模型、agent guide 和法律边界。                                                                                     |
| Phase 1: Minimal Runnable Starter | 本地通过 | 基础 TanStack Start + Cloudflare Workers 模板可构建，使用 Tailwind CSS，已有最小 UI primitives，通过 smoke tests，并已有 CI/deploy workflows。 |
| Phase 2: Database And Auth        | 本地通过 | 已有 D1、Drizzle、Better Auth、认证页面、session API、可复用 protected route guards、auth migrations、account route 和 auth e2e smoke。        |
| Phase 3: CLI MVP                  | 本地通过 | 已有 `create`、`doctor`、`add database`、`add auth`、CLI 单元测试和模块感知 doctor 检查。                                                      |
| Phase 4: Billing And Storage      | 本地通过 | 已有 Stripe billing 与 R2 storage 模块、元数据 schema、认证 API、webhook/entitlement 处理和模块 smoke tests。                                  |
| Phase 5: Recipes                  | 本地通过 | API keys、OpenAPI 和 API rate limit recipes 已有文档、CLI installers 和 smoke tests。                                                          |
| Phase 6: Ecosystem                | 未开始   | Docs site、贡献指南、发布流程和 examples 后续再做。                                                                                            |

## MVP 验收进度

| 验收项                                | 状态 | 验证方式                                                                                     |
| ------------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| 依赖可以成功安装                      | 通过 | `pnpm smoke` 会安装生成应用。                                                                |
| 应用可以本地启动                      | 通过 | base 生成应用 runtime smoke 会启动 dev server。                                              |
| Home route 可以渲染                   | 通过 | base 生成应用 runtime smoke 会检查 `/`。                                                     |
| Health route 返回成功                 | 通过 | base 生成应用 runtime smoke 会检查 `/health`。                                               |
| Health API 返回成功                   | 通过 | base 生成应用 runtime smoke 会检查 `/api/health`。                                           |
| Trusted API CORS 默认保持收紧         | 通过 | base 生成应用 runtime smoke 会检查 trusted 和 untrusted origins。                            |
| 认证后的 `/api/v1/me` 返回当前用户    | 通过 | auth 生成应用 runtime smoke 会登录并检查 `/api/v1/me`。                                      |
| D1 migration 可以本地运行             | 通过 | database 生成应用 smoke 会运行 generate 和 local apply。                                     |
| 用户可以注册                          | 通过 | auth browser smoke 会通过生成 UI 注册。                                                      |
| 用户可以登录                          | 通过 | auth browser smoke 会通过生成 UI 重新登录。                                                  |
| 匿名用户不能访问 dashboard            | 通过 | auth 生成应用 runtime smoke 会检查 dashboard redirect。                                      |
| 登录用户可以访问 dashboard            | 通过 | auth browser smoke 会在注册和登录后验证 dashboard。                                          |
| 应用可以构建到 Cloudflare Workers     | 通过 | `pnpm smoke` 会运行生成应用 build。                                                          |
| Worker deploy bundle 通过本地 dry-run | 通过 | base 生成应用 smoke 会运行 `pnpm deploy:dry-run`。                                           |
| 已部署 Worker routes 可自动验证       | 通过 | base 生成应用 smoke 会用 dev URL 运行 `pnpm verify:deployed`。                               |
| 生成应用包含 CI 和 deploy workflows   | 通过 | base template 包含 CI 和手动 Cloudflare deploy workflows。                                   |
| 生成应用 env 文件可安全自定义         | 通过 | base smoke 和 release audit 会检查 env examples 与 `.gitignore`。                            |
| 生成应用包含中文文档                  | 通过 | base smoke 会检查生成应用中文 env 和 deployment docs。                                       |
| 模块包含中文文档                      | 通过 | database/auth/billing/storage/API keys/OpenAPI/API rate limit smoke 会检查生成应用模块文档。 |
| 生成 README 会链接模块文档            | 通过 | CLI、module smoke 和 pack check 会验证 README 模块链接。                                     |
| Doctor 可发现缺失的模块文档           | 通过 | CLI 单元测试和 pack check 会在模块文档已安装时运行 doctor。                                  |
| Doctor 会检查基础文档和 secret guards | 通过 | CLI 单元测试、CLI smoke 和 pack check 覆盖 base doctor checks。                              |
| 生成应用包含本地 ShipStack CLI        | 通过 | CLI 单元测试和 pack check 会验证 `@shipstack-dev/cli` 已加入生成应用。                       |
| 支持只检查本地 release audit          | 通过 | `pnpm release:audit:local` 会跳过外部 gates。                                                |
| 支持快速本地验证命令                  | 通过 | `pnpm verify:local` 会运行本地 repo/package gates，不跑 smoke。                              |
| 部署文档足够手动执行                  | 通过 | 已有生成应用和维护者部署检查清单。                                                           |
| 生成应用有匹配布局的 `AGENTS.md`      | 通过 | base template 和已安装模块会提供 `AGENTS.md` 指引。                                          |

## 测试进度

| 检查                               | 状态     | 命令                                    |
| ---------------------------------- | -------- | --------------------------------------- |
| Repository typecheck               | 通过     | `pnpm typecheck`                        |
| Repository build                   | 通过     | `pnpm build`                            |
| CLI behavior smoke                 | 通过     | `pnpm smoke`                            |
| Generated base app smoke           | 通过     | `pnpm smoke`                            |
| Generated database app smoke       | 通过     | `pnpm smoke`                            |
| Generated auth app smoke           | 通过     | `pnpm smoke`                            |
| Generated billing app smoke        | 通过     | `node scripts/smoke/billing.mjs`        |
| Generated storage app smoke        | 通过     | `node scripts/smoke/storage.mjs`        |
| Generated API keys app smoke       | 通过     | `node scripts/smoke/api-keys.mjs`       |
| Generated OpenAPI app smoke        | 通过     | `node scripts/smoke/openapi.mjs`        |
| Generated API rate limit app smoke | 通过     | `node scripts/smoke/api-rate-limit.mjs` |
| Generated app lint                 | 通过     | `pnpm smoke`                            |
| Wrangler deploy dry-run            | 通过     | `pnpm smoke`                            |
| Deployed route verifier            | 通过     | `pnpm smoke`                            |
| 生成应用 env 安全                  | 通过     | `pnpm smoke`, `pnpm release:audit`      |
| 生成应用中文文档                   | 通过     | `pnpm smoke`, `pnpm pack:check`         |
| 生成 README 当前模块说明           | 通过     | `node scripts/smoke/base.mjs`           |
| 模块中文文档                       | 通过     | `pnpm smoke`, `pnpm pack:check`         |
| README 模块文档链接                | 通过     | `pnpm smoke`, `pnpm pack:check`         |
| Doctor 模块文档检查                | 通过     | `pnpm test`, `pnpm pack:check`          |
| Doctor base docs 检查              | 通过     | `pnpm test`, `pnpm pack:check`          |
| 生成应用本地 ShipStack CLI         | 通过     | `pnpm test`, `pnpm pack:check`          |
| 本地-only release audit            | 通过     | `pnpm release:audit:local`              |
| 快速本地验证                       | 通过     | `pnpm verify:local`                     |
| 完整本地发布验证                   | 通过     | `pnpm verify:release`                   |
| 完整 release audit                 | 本地通过 | `pnpm release:audit:local`              |
| 本地 npm publish dry-run           | 通过     | `pnpm publish:dry-run`                  |
| Cloudflare 临时部署                | 需要批准 | `pnpm smoke:temporary-deploy`           |
| CLI unit tests                     | 通过     | `pnpm test`                             |
| Runtime API tests                  | 通过     | `pnpm smoke`                            |
| API CORS smoke                     | 通过     | `pnpm smoke`                            |
| Auth browser e2e tests             | 通过     | `pnpm smoke`                            |
| D1 migration smoke                 | 通过     | `pnpm smoke`                            |
| Auth migration smoke               | 通过     | `pnpm smoke`                            |
| Stripe billing webhook smoke       | 通过     | `node scripts/smoke/billing.mjs`        |
| R2 storage API smoke               | 通过     | `node scripts/smoke/storage.mjs`        |
| API key bearer auth smoke          | 通过     | `node scripts/smoke/api-keys.mjs`       |
| OpenAPI generation smoke           | 通过     | `node scripts/smoke/openapi.mjs`        |
| API rate limit smoke               | 通过     | `node scripts/smoke/api-rate-limit.mjs` |
| Smoke dev server 端口重试          | 通过     | `node scripts/smoke/base.mjs`           |
| 模块 AGENTS 指引                   | 通过     | `pnpm test`, `pnpm smoke`               |
| 开源许可证                         | 已添加   | `LICENSE`                               |
| 贡献指南                           | 已添加   | `CONTRIBUTING.md`                       |
| 快速开始文档                       | 通过     | `pnpm release:audit:local`              |
| 安全策略                           | 已添加   | `SECURITY.md`                           |
| Issue 和 PR templates              | 已添加   | `.github` templates                     |
| Release checklist                  | 已添加   | `docs/RELEASE.md`                       |
| npm package 内容                   | 通过     | `pnpm pack:check`                       |
| CI workflow                        | 已添加   | GitHub Actions                          |
| Release verification command       | 通过     | `pnpm verify:release`                   |
| v0.1.0 release notes               | 已添加   | `docs/releases`                         |
| 本地 npm publish dry-run command   | 通过     | `pnpm publish:dry-run`                  |
| npm publish workflow               | 已添加   | `.github/workflows/release-npm.yml`     |

## 下一优先级

1. 刷新 npm auth 后，把 npm `latest` dist-tag 移到 `0.1.0-alpha.1`。
2. 继续收集 stable `v0.1.0` 前的首次运行反馈。

## 更新规则

- 只有经过自动化检查或写明手动验证后，状态才能标为 `通过`。
- 代码存在但还没端到端验证时，用 `部分完成`。
- 行为变化时，尽量在同一个 commit 里更新这个文件。
- 详细设计变化放到 `PROJECT_DESIGN.md`，不要放在这里。
