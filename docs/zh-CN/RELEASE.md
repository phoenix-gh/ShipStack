# Release Checklist

这份 checklist 给维护者准备 ShipStack 第一个 release 时使用。

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

10. 创建 release tag。

    ```sh
    git tag v0.1.0
    git push origin v0.1.0
    ```

11. 从 GitHub Actions 发布 npm packages。

    等 tag 或 release branch 上的 CI 通过后，使用 `Release npm Packages`
    workflow。先用 `dry_run: true` 跑一次并检查输出；确认无误后，再用
    `dry_run: false` 正式发布。

    Packages 会按依赖顺序发布：

    - `@shipstack/core`
    - `@shipstack/cli`
    - `create-shipstack-app`

    该 workflow 需要仓库 secret `NPM_TOKEN`，并启用 npm provenance。请使用具备
    publish 权限的 npm granular access token。如果 npm 账号或 organization 要求
    发布时使用 two-factor authentication，这个 token 必须允许绕过 2FA；否则即使
    dry-run 和 release verification 都通过，正式发布仍会失败。

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
   `@shipstack/core`、`@shipstack/cli` 和 `create-shipstack-app`，然后把 run URL
   和结果记录到 [Release 证据记录](./RELEASE_EVIDENCE.md)。

6. 配置 npm 发布 token。

   创建一个可以发布 `@shipstack/core`、`@shipstack/cli` 和
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

当前 release candidate 已记录这些外部 release gates：

- 真实 Cloudflare 账号部署验证
- 远端 GitHub Actions CI
- 远端 npm publish workflow dry-run

打 tag 前，在 release commit 上重跑 `pnpm release:audit`，并确认最新远端 CI
仍为绿色。Cloudflare temporary deploy smoke 是有价值的补充证据，但不能替代真实账号部署验证。

2026-06-28 的正式 npm publish 尝试已经通过 `pnpm verify:release`，随后在
`npm publish` 阶段失败，原因是当前 `NPM_TOKEN` 不是具备发布权限且可绕过 2FA
的 token。重新运行 workflow 前，请先查看
[Release 证据记录](./RELEASE_EVIDENCE.md)。
