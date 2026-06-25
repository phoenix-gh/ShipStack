# API Keys 模块

API Keys 模块为 server-to-server、CLI 和第三方集成客户端增加 API key 认证。

在 database 和 auth 之后安装：

```bash
shipstack add database
shipstack add auth
shipstack add api-keys
pnpm db:generate
pnpm db:cf:migrate:local
```

## Routes

- `GET /api/v1/api-keys` 列出当前登录用户的 keys。
- `POST /api/v1/api-keys` 为当前登录用户创建 key。
- `DELETE /api/v1/api-keys?id=<key-id>` 撤销当前登录用户的 key。
- `GET /api/v1/me` 同时支持浏览器 session 和 `Authorization: Bearer <api-key>`。

明文 key 只会在 `POST /api/v1/api-keys` 的响应中返回一次。D1 中只保存 hash。

## 创建 Key

```bash
curl -X POST http://localhost:5173/api/v1/api-keys \
  -H "content-type: application/json" \
  -b "your-browser-session-cookie" \
  -d '{"name":"CLI key"}'
```

响应包含：

```json
{
  "data": {
    "apiKey": {
      "key": "ss_...",
      "apiKey": {
        "id": "...",
        "name": "CLI key",
        "keyPrefix": "ss_..."
      }
    }
  },
  "error": null,
  "requestId": "..."
}
```

## 客户端认证

```bash
curl http://localhost:5173/api/v1/me \
  -H "Authorization: Bearer ss_..."
```

API keys 用于把 API 请求归属到拥有者用户。不要把 API keys 当作 native mobile 用户登录 token；native app 用户认证需要明确的 session 或 bearer-token 设计。

## 验证

```bash
pnpm db:generate
pnpm db:cf:migrate:local
pnpm test
pnpm build
```
