# 数据库

这个项目使用 Cloudflare D1 和 Drizzle ORM。

## 文件

- `src/db/schema.ts`：Drizzle schema
- `src/db/client.ts`：D1 Drizzle client factory
- `drizzle.config.ts`：Drizzle Kit 配置
- `drizzle/migrations`：生成的 SQL migrations

## 环境变量

Drizzle Kit 的远程操作会使用 D1 HTTP API：

```text
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
```

这些值只用于本地 tooling。不要把它们暴露给浏览器代码。

## 创建 D1 Database

```bash
pnpm db:cf:create
```

把返回的 database ID 复制到 `wrangler.jsonc` 和 `.env.local`。

## 生成 Migrations

```bash
pnpm db:generate
```

## 用 Wrangler 应用 Migrations

本地：

```bash
pnpm db:cf:migrate:local
```

远程：

```bash
pnpm db:cf:migrate:remote
```

## Drizzle Kit 远程命令

```bash
pnpm db:push
pnpm db:migrate
pnpm db:studio
```
