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
  - `@shipstack-dev/core`
  - `@shipstack-dev/cli`
  - `create-shipstack-app`
- 备注：远端 workflow 已运行 `pnpm verify:release`，并对所有可发布 package
  完成 `npm publish --dry-run --provenance --tag next`，包括可用的
  `create-shipstack-app` package 名称。

## npm Publish Workflow 正式发布证据

状态：已通过

- 日期：2026-06-30
- Commit：6c50d2b
- Workflow：Release npm Packages
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28456891005
- 输入：

  ```text
  dry_run: false
  npm_tag: next
  ```

- 结果：通过
- 发布后验证的 packages：
  - `@shipstack-dev/core@0.1.0-alpha.1`：已发布，`next`
  - `@shipstack-dev/cli@0.1.0-alpha.1`：已发布，`next`
  - `create-shipstack-app@0.1.0-alpha.1`：已发布，`next`
- 备注：这个 alpha 包含生成应用本地 CLI 修复。npm registry 验证确认
  `next` 指向 `0.1.0-alpha.1`；`latest` 仍指向 `0.1.0-alpha.0`，直到拥有有效
  npm auth 的 maintainer 移动它。

上一次正式发布：

- 日期：2026-06-30
- Commit：d76f1a6
- Workflow：Release npm Packages
- Run URL：https://github.com/phoenix-gh/ShipStack/actions/runs/28451043094
- 输入：

  ```text
  dry_run: false
  npm_tag: next
  ```

- 结果：通过
- 发布后验证的 packages：
  - `@shipstack-dev/core@0.1.0-alpha.0`：已发布，`next` 和 `latest`
  - `@shipstack-dev/cli@0.1.0-alpha.0`：已发布，`next` 和 `latest`
  - `create-shipstack-app@0.1.0-alpha.0`：已发布，`next` 和 `latest`
- 备注：workflow 已通过 `pnpm verify:release`，并用
  `npm publish --access public --provenance --tag next` 发布全部 packages。npm
  registry 验证已确认发布版本和 repository metadata。

## GitHub Alpha Release 证据

状态：已通过

- 日期：2026-06-30
- Commit：86dbb73
- Tag：`v0.1.0-alpha.0`
- Release URL：https://github.com/phoenix-gh/ShipStack/releases/tag/v0.1.0-alpha.0
- 结果：通过
- 备注：已创建 annotated git tag 和 GitHub prerelease，与已发布 npm package
  version `0.1.0-alpha.0` 匹配。

## 已发布 Alpha 首次运行反馈

状态：后续版本已发布

- 日期：2026-06-30
- 已发布版本：`0.1.0-alpha.0`
- 命令：

  ```sh
  pnpm create shipstack-app published-alpha-app
  ```

- 结果：显式把 `@shipstack-dev/cli@0.1.0-alpha.0` 添加为生成应用
  dev dependency 后，生成应用依赖安装、模块安装、lint、tests、typecheck、build、
  本地 D1 migration、OpenAPI generation 和 `deploy:dry-run` 都已通过。
- 发现：已发布 alpha 生成的 app 在 `pnpm install` 后没有本地 `shipstack`
  binary，因此 `pnpm exec shipstack doctor` 会失败，直到手动添加
  `@shipstack-dev/cli`。
- 修复：base template 现在会把兼容的 `@shipstack-dev/cli` prerelease range 写入
  生成应用 dev dependency，CLI 和 package checks 也会在稳定版 `v0.1.0`
  前覆盖这个首次运行预期。
- 后续：`0.1.0-alpha.1` 已带着这个修复发布到 `next` dist-tag。在 `latest`
  移动之前，请使用 `pnpm create shipstack-app@next my-app`。

历史阻塞尝试：

- 2026-06-30，commit `204fe82`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28450280472：已通过
  `pnpm verify:release`，进入 `npm publish`，并完成 npm provenance 签名，
  随后因为 tarball package metadata 里的 `repository.url` 为空而以 `E422`
  失败；npm 期望它与 provenance 中的 `https://github.com/phoenix-gh/ShipStack`
  匹配。可发布 package metadata 已补上该 repository URL，release audit 也已加入检查。
- 2026-06-30，commit `3b084e4`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28409972907：已通过
  `pnpm verify:release`，进入 `npm publish`，并完成 npm provenance 签名，
  随后因为 npm provenance 不支持 private GitHub Actions source repositories
  而以 `E422` 失败。GitHub repository 已改为 public。
- 2026-06-29，commit `87f41a3`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28372735884：已通过
  `pnpm verify:release`，随后在发布旧的 `@shipstack/core` package 时以
  `E404 Not Found` 失败。原来的 `@shipstack` scope 已被其他 owner 占用，因此
  publishable scoped packages 已迁移到 `@shipstack-dev/core` 和
  `@shipstack-dev/cli`。
- 2026-06-30，commit `7e48c8e`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28409697166：发布前的
  `pnpm verify:release` 失败，原因是 Chromium 在 auth browser smoke navigation
  期间报告 `net::ERR_ABORTED`。将 Playwright navigation waiters 替换为 path
  polling 和短重试后，targeted local auth smoke 已通过。
- 2026-06-30，commit `c5fae75`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28409426279：发布前的
  `pnpm verify:release` 失败，原因是 auth browser smoke 在期待匿名
  protected-route redirect 时复用了已清 session 的页面。该检查改为使用全新浏览器
  页面后，targeted local auth smoke 已通过。
- 2026-06-29，commit `0d8cbf4`，
  https://github.com/phoenix-gh/ShipStack/actions/runs/28371537956：已通过
  `pnpm verify:release`，随后因 npm 发布时 2FA bypass 要求在 `npm publish`
  阶段失败。
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
