# 模块 Manifest 设计

ShipStack modules 描述可安装功能，例如 database、auth、billing、storage、API keys 和 admin。

模块系统应该先保持简单，随着 CLI 成熟逐步结构化。

## 目标

- 让模块可以通过 CLI 安装
- 保持模块 setup 幂等
- 从模块收集 env vars 和 docs
- 让生成项目容易检查
- 让社区 recipes 使用同一种形态

## 非目标

- 在生成的 SaaS app 里做 runtime plugin loading
- 为所有模块做动态 feature flags
- MVP 阶段做复杂依赖求解
- 第一版支持所有 provider

## 概念 Manifest

```ts
export interface ShipStackModule {
  id: string;
  name: string;
  description: string;
  category: "core" | "provider" | "recipe";
  dependencies?: string[];
  conflicts?: string[];
  packages?: PackageChanges;
  env?: EnvVarSpec[];
  wrangler?: WranglerChanges;
  files?: FileOperation[];
  patches?: PatchOperation[];
  migrations?: MigrationSpec[];
  scripts?: PackageScriptSpec[];
  docs?: DocSpec[];
  checks?: CheckSpec[];
}
```

## 字段说明

### `id`

稳定的机器名。

示例：

- `database-d1`
- `api`
- `auth-better-auth`
- `billing-stripe`
- `storage-r2`

### `category`

`core` 用于第一方核心模块，`provider` 用于 provider-specific integration，`recipe` 用于可选高级功能。

### `dependencies`

安装前必须存在的其他 module IDs。

示例：`auth-better-auth` 依赖 `database-d1`。

示例：`api-keys` 依赖 `database-d1` 和 `auth-better-auth`。

### `conflicts`

不能同时安装的 module IDs。

示例：未来的 `database-postgres` 可能和 `database-d1` 冲突，除非已经支持多数据库。

### `packages`

要加入 `package.json` 的 dependencies。

CLI 应尽量保留已有 dependency versions，除非存在明确版本冲突。

### `env`

模块引入的环境变量。

```ts
export interface EnvVarSpec {
  name: string;
  scope: "public" | "build" | "runtime" | "local";
  required: boolean;
  example?: string;
  description: string;
}
```

### `wrangler`

Cloudflare bindings 或 compatibility settings。

示例：

- D1 database binding
- R2 bucket binding
- compatibility date
- compatibility flags

### `files`

从模块 template 复制的文件。

File operations 应支持：

- create
- create if missing
- 只有显式 force 时 overwrite

### `patches`

对现有文件的结构化编辑。

可行时优先使用结构化编辑，而不是普通字符串替换：

- `package.json` 使用 JSON
- `wrangler.jsonc` 使用 JSONC-aware edits
- route tree 和 schema exports 使用 TypeScript AST 或稳定 insertion markers

### `migrations`

数据库 migrations 或 schema additions。

MVP 可以通过 Drizzle commands 生成 migrations，而不是每个模块都携带固定 SQL。

### `docs`

要新增或更新的文档片段。

Docs 应包含：

- setup steps
- env vars
- commands
- verification path
- troubleshooting

### `checks`

供 `shipstack doctor` 使用的验证检查。

示例：

- required env var exists
- D1 binding exists in Wrangler config
- migration directory exists
- auth route is registered
- API health route responds successfully
- webhook secret exists

## 幂等规则

重复运行 `shipstack add <module>` 不得：

- 重复 package scripts
- 重复 env vars
- 重复 Wrangler bindings
- 重复 route exports
- 重复 schema exports
- 静默覆盖用户编辑过的文件

如果文件已存在且和 template 不同，CLI 应该：

- 应用结构化 patch
- interactive mode 下询问确认
- non-interactive mode 下写出 `.shipstack.patch`
- 或用清晰错误失败

## 模块安装流程

1. 读取 project state。
2. 加载 module manifest。
3. 检查 dependencies 和 conflicts。
4. 预览 operations。
5. 应用 package changes。
6. 应用 file operations。
7. 应用 structured patches。
8. 更新 env examples。
9. 更新 docs。
10. 运行 module checks。
11. 打印 next steps。

## Project State

CLI 最终可以写入 state file：

```json
{
  "version": 1,
  "modules": {
    "database-d1": {
      "installedAt": "2026-01-01T00:00:00.000Z",
      "version": "0.1.0"
    }
  }
}
```

可能文件名：

```text
.shipstack/state.json
```

不要只依赖 state file。patch 前永远检查真实项目状态。

## 生成 AGENTS.md 片段

每个模块都可以贡献 AI-agent guidance。

示例：

```md
## Auth Module

- Use `src/features/auth/server.ts` for server-side session access.
- Use `requireUser()` in protected loaders and server functions.
- Do not read session cookies manually in route files.
```

生成 app 的 `AGENTS.md` 应由已安装模块组装。
