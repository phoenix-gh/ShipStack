# Release Checklist

这份 checklist 给维护者准备 ShipStack 第一个 release 时使用。

## Alpha Release 状态

`v0.1.0-alpha.0` 已发布：

- GitHub release：https://github.com/phoenix-gh/ShipStack/releases/tag/v0.1.0-alpha.0
- npm packages：
  - `@shipstack-dev/core@0.1.0-alpha.0`
  - `@shipstack-dev/cli@0.1.0-alpha.0`
  - `create-shipstack-app@0.1.0-alpha.0`

repository 已改为 public，因此 npm provenance 可以验证 GitHub Actions source
metadata。

## v0.1.0 Gate

以下检查完成前，不要打 `v0.1.0` tag：

1. 确认 worktree 干净。

   ```sh
   git status --short
   ```

   也可以运行 release gate audit，快速查看本地和外部阻塞项：

   ```sh
   pnpm release:audit
   ```

2. 运行本地 release verification。

   ```sh
   pnpm verify:release
   ```

3. 运行可选外部 temporary deploy smoke。

   ```sh
   pnpm smoke:temporary-deploy
   ```

4. 验证 npm package 内容。

   ```sh
   pnpm pack:check
   ```

5. 运行本地 npm publish dry-run。

   ```sh
   pnpm publish:dry-run
   ```

   这个命令会打包可发布 packages，并对每个 tarball 运行
   `npm publish --dry-run`。它不会真正发布 package，也不会使用 provenance；
   带 provenance 的发布仍以 GitHub Actions workflow 为准。

6. 执行 [部署验证](./DEPLOYMENT.md) 里的真实 Cloudflare 账号部署 checklist。

7. 确认 release branch 上的远端 GitHub Actions workflow 通过。

8. 在 [Release 证据记录](./RELEASE_EVIDENCE.md) 中记录真实部署后的 Worker 验证结果，
   然后在 [部署验证](./DEPLOYMENT.md) 或
   [v0.1.0 release notes](./releases/v0.1.0.md) 里总结结果。

9. 确认 release notes 包含：

   - 支持的 Node.js version
   - 支持的 pnpm version
   - 必需的 Cloudflare setup
   - verification commands
   - known limitations
   - next planned modules

10. 用已发布的 alpha packages 验证 first-run install。

    ```sh
    pnpm create shipstack-app my-app
    cd my-app
    pnpm install
    shipstack doctor
    ```

    安装第一方 modules，运行生成应用 checks，并在打 stable `v0.1.0` 前记录需要修复
    的问题或 known limitations。

11. 创建 release tag。

    ```sh
    git tag v0.1.0
    git push origin v0.1.0
    ```

12. 从 GitHub Actions 发布 npm packages。

    等 tag 或 release branch 上的 CI 通过后，使用 `Release npm Packages`
    workflow。先用 `dry_run: true` 跑一次并检查输出；确认无误后，再用
    `dry_run: false` 正式发布。

    Packages 会按依赖顺序发布：

    - `@shipstack-dev/core`
    - `@shipstack-dev/cli`
    - `create-shipstack-app`

    该 workflow 需要仓库 secret `NPM_TOKEN`，并启用 npm provenance。可发布 package
    的 `repository.url` metadata 必须匹配 public GitHub repository。

## Pre-Release Safety Checks

- 没有提交真实 secrets、tokens、session cookies 或 production IDs。
- 没有复制私有或付费 starter code、docs、assets、prompts 或实现细节。
- 用户可见变化已同步更新英文和中文文档。
- 修改 templates 或 modules 后，已通过 smoke tests 验证生成应用行为。
- `pnpm pack:check` 会在发布前验证 package 内容，并从打包 tarballs 创建应用。
- `pnpm publish:dry-run` 会在远端 workflow 使用 provenance 发布前，先验证 npm
  能以 dry-run 模式接受打包 tarballs。
- `docs/RELEASE_EVIDENCE.md` 记录外部 gate 链接和命令结果，但不记录 secrets。
- `docs/PROGRESS.md` 与当前 release 状态一致。

## 外部门槛执行清单

当本地检查已经通过，但 `pnpm release:audit` 仍报告外部阻塞项时，按这个顺序处理。

1. 配置 git remote，并推送 release branch。

   ```sh
   git remote add origin <repository-url>
   git push -u origin HEAD
   ```

   如果 `origin` 已经存在，先用 `git remote -v` 检查，不要直接覆盖。

2. 确认 Wrangler 已登录。

   ```sh
   pnpm dlx wrangler login
   pnpm dlx wrangler whoami
   ```

   不要把 Cloudflare tokens 或 account IDs 粘贴进已提交文件。

3. 按 [部署验证](./DEPLOYMENT.md) 执行真实 Cloudflare deploy pass。

   把已部署的 Worker URL 和 `pnpm verify:deployed` 结果记录到
   [Release 证据记录](./RELEASE_EVIDENCE.md)。

4. 确认 GitHub 远端 CI。

   在 GitHub Actions 中打开已推送的 branch 或 pull request，确认 CI workflow
   已通过，然后把 run URL 和结果记录到
   [Release 证据记录](./RELEASE_EVIDENCE.md)。

5. 在远端运行 npm publish workflow dry-run。

   使用 `Release npm Packages` workflow，并设置 `dry_run: true`。确认它检查了
   `@shipstack-dev/core`、`@shipstack-dev/cli` 和 `create-shipstack-app`，然后把 run URL
   和结果记录到 [Release 证据记录](./RELEASE_EVIDENCE.md)。

6. 配置 npm 发布 token。

   创建一个可以发布 `@shipstack-dev/core`、`@shipstack-dev/cli` 和
   `create-shipstack-app` 的 npm granular access token，并把它保存为 GitHub
   repository secret `NPM_TOKEN`。

   如果 npm 发布启用了 two-factor authentication，确认这个 token 明确允许绕过
   2FA。classic automation token，或没有 publish 和 2FA bypass 权限的 granular
   token，都不足以完成正式发布 workflow。

7. 重新运行完整 audit。

   ```sh
   pnpm release:audit
   ```

   只有这个命令没有本地失败、也没有外部阻塞项时，才可以准备打 tag。

## 当前已知外部缺口

alpha release 已记录这些外部 release gates：

- 真实 Cloudflare 账号部署验证
- 远端 GitHub Actions CI
- 远端 npm publish workflow dry-run
- 带 provenance 的真实 npm publish
- GitHub prerelease tag

打 stable `v0.1.0` tag 前，在 release commit 上重跑 `pnpm release:audit`，确认
最新远端 CI 仍为绿色，并基于已发布 alpha packages 重复 first-run verification。
Cloudflare temporary deploy smoke 是有价值的补充证据，但不能替代真实账号部署验证。
