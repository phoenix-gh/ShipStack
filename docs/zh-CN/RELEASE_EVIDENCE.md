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

状态：待完成

- 日期：
- Commit：
- 维护者：
- Wrangler 账号检查：

  ```sh
  pnpm dlx wrangler whoami
  ```

- Worker URL：
- 部署命令：

  ```sh
  pnpm run deploy
  ```

- Route 验证命令：

  ```sh
  pnpm verify:deployed https://<your-worker-url>
  ```

- 结果：
- 备注：

## GitHub Actions 证据

状态：已通过

- 日期：2026-06-28
- Commit：d9c5c45
- Workflow：CI
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28318813137
- 结果：通过
- 备注：在修复 fresh clone 下 package typecheck 顺序，并稳定 auth browser
  smoke checks 之后，远端 `master` branch 已通过 `pnpm verify:release`。

## npm Publish Workflow Dry-Run 证据

状态：待完成

- 日期：
- Commit：
- Workflow：
- Run URL：
- 输入：

  ```text
  dry_run: true
  ```

- 结果：
- 已检查 packages：
  - `@shipstack/core`
  - `@shipstack/cli`
  - `create-shipstack`
- 备注：

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
