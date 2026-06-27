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
    - `create-shipstack`

    该 workflow 需要仓库 secret `NPM_TOKEN`，并启用 npm provenance。

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

## 当前已知外部缺口

当前 workspace 还不能完成最终 release gate，因为：

- Wrangler 还没有用真实 Cloudflare 账号登录。
- 还没有 git remote，因此无法检查远端 GitHub Actions。
- `docs/RELEASE_EVIDENCE.md` 还没有记录真实 Cloudflare deploy、远端 GitHub
  Actions 和远端 npm publish workflow dry-run 的通过证据。

Cloudflare temporary deploy smoke 是有价值的证据，但不能替代真实账号部署验证。
