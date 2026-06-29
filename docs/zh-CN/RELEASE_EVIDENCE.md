# Release 证据记录

准备 ShipStack release 时使用这个文件。把外部 gates 的链接和命令结果记录在这里，
然后再更新 `docs/PROGRESS.md` 和 `docs/releases/v0.1.0.md` 的最终状态。

不要粘贴 secrets、API tokens、session cookies、需要保密的 account IDs，或完整环境文件。

## 必填字段

完整 release audit 会把这些 section 当作外部 gate。只有 `状态` 不再是
`待完成`，并且下面的必填字段都有值时，section 才会通过：

- 真实 Cloudflare 部署证据：日期、Commit、Worker URL、结果
- GitHub Actions 证据：日期、Commit、Run URL、结果
- npm Publish Workflow Dry-Run 证据：日期、Commit、Run URL、结果

## 真实 Cloudflare 部署证据

状态：已通过

- 日期：2026-06-28
- Commit：86578a9
- 维护者：phoenix-gh
- Wrangler 账号检查：通过

  ```sh
  pnpm dlx wrangler whoami
  ```

- Worker URL：https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
- 部署命令：

  ```sh
  pnpm run deploy
  ```

- Route 验证命令：

  ```sh
  pnpm verify:deployed https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
  ```

- 结果：通过
- 备注：在 `/tmp/shipstack-real-deploy-app-20260628` 生成了全新的 base app，
  运行依赖安装、生成应用验证、真实 Cloudflare Workers 部署，以及已部署 route
  验证。不要提交 Cloudflare account IDs。

## GitHub Actions 证据

状态：已通过

- 日期：2026-06-28
- Commit：86578a9
- Workflow：CI
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28320940187
- 结果：通过
- 备注：修复生成应用绝对路径名称、生成应用部署命令、可发布 create package 名称，
  以及 auth browser smoke 导航时序后，远端 `master` branch 已通过
  `pnpm verify:release`。

## npm Publish Workflow Dry-Run 证据

状态：已通过

- 日期：2026-06-28
- Commit：86578a9
- Workflow：Release npm Packages
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28320946840
- 输入：

  ```text
  dry_run: true
  npm_tag: next
  ```

- 结果：通过
- 已检查 packages：
  - `@shipstack/core`
  - `@shipstack/cli`
  - `create-shipstack-app`
- 备注：远端 workflow 已运行 `pnpm verify:release`，并对所有可发布 package
  完成 `npm publish --dry-run --provenance --tag next`，包括可用的
  `create-shipstack-app` package 名称。

## npm Publish Workflow 正式发布尝试

状态：已阻塞

- 日期：2026-06-29
- Commit：0d8cbf4
- Workflow：Release npm Packages
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28371537956
- 输入：

  ```text
  dry_run: false
  npm_tag: next
  ```

- 结果：已阻塞
- 失败后检查的 packages：
  - `@shipstack/core@0.1.0-alpha.0`：未发布
  - `@shipstack/cli@0.1.0-alpha.0`：未发布
  - `create-shipstack-app@0.1.0-alpha.0`：未发布
- 备注：在 `0d8cbf4` 修复 auth smoke 断言后，workflow 已通过
  `pnpm verify:release`，随后在第一个正式 `npm publish` 时失败，因为 npm
  仍要求 two-factor authentication，或启用了 bypass 2FA 的 granular access
  token。更新后的 `NPM_TOKEN` 已存在，但仍不满足 npm 发布时的 2FA bypass
  要求。

历史阻塞尝试：

- 2026-06-28，commit `907a86e`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28325638587：已通过
  `pnpm verify:release`，随后因同一个 npm 2FA bypass 要求在 `npm publish`
  阶段失败。
- 2026-06-29，commit `9baf21b`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28370661628：发布前的
  `pnpm verify:release` 失败，原因是 auth browser smoke 文本断言存在时序波动。
  已由 `0d8cbf4` 修复。

## 可选 Cloudflare 临时部署证据

状态：待完成

- 日期：
- Commit：
- 命令：

  ```sh
  pnpm smoke:temporary-deploy
  ```

- Temporary Worker URL：
- 结果：
- 备注：
