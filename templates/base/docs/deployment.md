# Deploying To Cloudflare Workers

This template follows the official TanStack Start + Cloudflare Workers setup:

- `@cloudflare/vite-plugin`
- `wrangler`
- `@tanstack/react-start/server-entry`
- `compatibility_flags: ["nodejs_compat"]`

## Login

```bash
pnpm dlx wrangler login
```

## Build

```bash
pnpm build
```

## Deploy

```bash
pnpm deploy
```

## Generate Cloudflare Types

```bash
pnpm cf-typegen
```

