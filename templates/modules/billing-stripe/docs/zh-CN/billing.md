# 支付

billing 模块会添加 Stripe Checkout、Stripe customer portal session、已验证签名的 webhook endpoint、本地 subscription state，以及 server-side entitlement helper。

## 添加内容

- `src/db/billing-schema.ts`：Stripe customers、subscriptions 和 processed events
- `src/features/billing/server.ts`：checkout、portal、webhook 和 entitlement 行为
- `src/routes/api.v1.billing.checkout.ts`：`POST /api/v1/billing/checkout`
- `src/routes/api.v1.billing.portal.ts`：`POST /api/v1/billing/portal`
- `src/routes/api.v1.billing.status.ts`：`GET /api/v1/billing/status`
- `src/routes/api.stripe.webhook.ts`：`POST /api/stripe/webhook`

## 环境变量

复制 `.dev.vars.example` 到 `.dev.vars`，然后设置：

```sh
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""
BILLING_SUCCESS_URL="http://localhost:5173/account?checkout=success"
BILLING_CANCEL_URL="http://localhost:5173/account?checkout=cancelled"
BILLING_PORTAL_RETURN_URL="http://localhost:5173/account"
```

生产环境使用 Wrangler secrets 保存这些值。

## 设置

生成并应用 billing 元数据 migration：

```sh
pnpm db:generate
pnpm db:cf:migrate:local
```

生产环境：

```sh
pnpm db:cf:migrate:remote
pnpm wrangler secret put STRIPE_SECRET_KEY
pnpm wrangler secret put STRIPE_WEBHOOK_SECRET
pnpm wrangler secret put STRIPE_PRICE_ID
pnpm wrangler secret put BILLING_SUCCESS_URL
pnpm wrangler secret put BILLING_CANCEL_URL
pnpm wrangler secret put BILLING_PORTAL_RETURN_URL
```

在 Stripe 中把 webhook 指向：

```text
https://<your-worker-url>/api/stripe/webhook
```

建议事件：

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 安全说明

- Stripe webhooks 是 subscription state 的事实来源。
- Checkout 和 portal routes 都需要 Better Auth session。
- Webhook 必须用 `STRIPE_WEBHOOK_SECRET` 验证签名。
- 已处理的 Stripe event ID 会被记录，用于保证幂等。
- 付费功能检查应该调用 `hasActiveSubscription()` 或 `getBillingStatus()`。
