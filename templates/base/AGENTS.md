# Generated ShipStack App Agent Guide

This app was generated from the ShipStack base template.

## Layout

- `src/routes` contains TanStack Router and TanStack Start server routes.
- `src/features` contains business logic grouped by feature.
- `src/features/api` contains shared external API response helpers.
- `src/lib` contains shared utilities.
- `src/styles` contains global styles.

## Rules

- Keep route files thin; put business logic in feature modules.
- Use `/api/health` for operational checks.
- Use `/api/v1/*` for external API routes.
- Use helpers from `src/features/api` for JSON API responses.
- Do not commit `.env`, `.env.local`, or `.dev.vars`.
- Follow Cloudflare Workers constraints; do not assume Node-only APIs are available unless the compatibility setting supports them.

