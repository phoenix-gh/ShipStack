# Release Checklist

这份 checklist 给维护者准备 ShipStack 第一个 release 时使用。

## v0.1.0 Gate

以下检查完成前，不要打 `v0.1.0` tag：

1. 确认 worktree 干净。

   ```sh
   git status --short
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

5. 执行 [部署验证](./DEPLOYMENT.md) 里的真实 Cloudflare 账号部署 checklist。

6. 确认 release branch 上的远端 GitHub Actions workflow 通过。

7. 在 [部署验证](./DEPLOYMENT.md) 或
   [v0.1.0 release notes](./releases/v0.1.0.md) 里记录真实部署后的 Worker 验证结果。

8. 确认 release notes 包含：

   - 支持的 Node.js version
   - 支持的 pnpm version
   - 必需的 Cloudflare setup
   - verification commands
   - known limitations
   - next planned modules

9. 创建 release tag。

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

## Pre-Release Safety Checks

- 没有提交真实 secrets、tokens、session cookies 或 production IDs。
- 没有复制私有或付费 starter code、docs、assets、prompts 或实现细节。
- 用户可见变化已同步更新英文和中文文档。
- 修改 templates 或 modules 后，已通过 smoke tests 验证生成应用行为。
- `docs/PROGRESS.md` 与当前 release 状态一致。

## 当前已知外部缺口

当前 workspace 还不能完成最终 release gate，因为：

- Wrangler 还没有用真实 Cloudflare 账号登录。
- 还没有 git remote，因此无法检查远端 GitHub Actions。

Cloudflare temporary deploy smoke 是有价值的证据，但不能替代真实账号部署验证。
