# 存储

storage 模块会添加一个私有 Cloudflare R2 bucket 和一个需要登录的文件 API。

## 添加内容

- `wrangler.jsonc` 中的 `FILES` R2 binding
- 用于文件元数据的 `src/db/storage-schema.ts`
- 用于 R2 和元数据操作的 `src/features/storage/server.ts`
- 用于 `/api/v1/files` 的 `src/routes/api.v1.files.ts`

## API

所有路由都需要 Better Auth session。

- `GET /api/v1/files` 列出当前用户的文件。
- `POST /api/v1/files` 将原始 request body 上传到 R2。原始文件名通过 `x-shipstack-filename` 传入。
- `DELETE /api/v1/files?id=<file-id>` 删除一个属于当前用户的文件。

响应会使用基础 API routes 相同的 JSON envelope。

## 设置

创建 bucket：

```sh
wrangler r2 bucket create shipstack-files
```

生成并应用元数据 migration：

```sh
pnpm db:generate
pnpm db:cf:migrate:local
```

生产环境需要在目标 Cloudflare 账号中创建 bucket，并按数据库文档运行 remote migration 命令。

## 安全说明

- 默认保持 R2 bucket 私有。
- 不要直接向客户端暴露 object key。
- 文件归属必须来自 Better Auth session。
- 删除文件或未来添加下载路由前，先检查 D1 元数据归属。
- 生产环境接收不可信大文件前，需要添加明确的上传大小限制。
