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
- Commit：092160f
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
- Commit：092160f
- Workflow：CI
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28319955653
- 结果：通过
- 备注：修复生成应用绝对路径名称和生成应用部署命令后，远端 `master` branch
  已通过 `pnpm verify:release`。

## npm Publish Workflow Dry-Run 证据

状态：已通过

- 日期：2026-06-28
- Commit：092160f
- Workflow：Release npm Packages
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28319962801
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
  完成 `npm publish --dry-run --provenance --tag next`。

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
