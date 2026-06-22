# 开发环境

## 工具链

使用较新的 Node.js 和 pnpm 环境。

最低版本：

- Node.js 22.12+
- pnpm 10+

## 安装依赖

```bash
pnpm install
```

## 验证 Workspace

```bash
pnpm typecheck
pnpm build
```

## 生成 Smoke App

先构建 CLI：

```bash
pnpm build
```

再创建临时应用：

```bash
mkdir -p /tmp/shipstack-smoke
cd /tmp/shipstack-smoke
node /workspace/projects/ShipStack/packages/create-shipstack/dist/cli.js smoke-app
cd smoke-app
pnpm install
pnpm test
pnpm typecheck
```

生成应用使用 TanStack Router route generation。`pnpm typecheck` 会先运行 `pnpm generate:routes`，再运行 `tsc`。

## pnpm Build Scripts

pnpm 10 可能提示 `esbuild`、`workerd` 等依赖的 build scripts 被忽略。如果本地 dev 或 build 需要这些 scripts，运行：

```bash
pnpm approve-builds
```

只批准你信任的包。
