# ShipStack

Open-source, modular, Cloudflare-first SaaS stack for TanStack Start.

ShipStack helps builders go from an empty directory to a deployed SaaS foundation with authentication, database, billing, storage, dashboard, and deployment workflows that are easy to inspect, test, and extend.

The project is intentionally not a clone of any private or paid starter. It is a production-oriented starter plus a module system, CLI workflows, and recipes that make the stack easier to adopt and maintain.

## Core Idea

Most SaaS projects lose their first week to repeated infrastructure work:

- authentication and protected routes
- database schema and migrations
- billing checkout and webhooks
- file storage and metadata
- environment variables and secrets
- Cloudflare D1, R2, Workers, and deploy setup
- dashboard, settings, API keys, and admin surfaces

ShipStack turns those tasks into a documented, testable, modular path.

## Intended Stack

- TanStack Start for the app framework
- TanStack Router for routing
- Cloudflare Workers for deployment
- Cloudflare D1 as the first database target
- Drizzle ORM for schema and migrations
- Cloudflare R2 for object storage
- Better Auth for authentication
- Stripe as the first billing provider
- Tailwind CSS and shadcn/ui for interface primitives
- Playwright and Vitest for verification

Cloudflare is the default path, but the architecture should keep provider seams explicit enough to support future adapters such as Postgres, S3-compatible storage, Polar, or Creem.

## Project Documents

- [Project Design](./docs/PROJECT_DESIGN.md)
- [MVP Specification](./docs/MVP_SPEC.md)
- [Module Manifest Design](./docs/MODULE_MANIFEST.md)
- [Roadmap](./docs/ROADMAP.md)
- [Progress](./docs/PROGRESS.md)
- [Deployment Verification](./docs/DEPLOYMENT.md)
- [Architecture Decisions](./docs/DECISIONS.md)
- [Legal And Competitive Boundaries](./docs/LEGAL_BOUNDARIES.md)
- [Development](./docs/DEVELOPMENT.md)
- [Testing](./docs/TESTING.md)
- [Agent Guide](./AGENTS.md)

Chinese documentation is available at [docs/zh-CN](./docs/zh-CN/README.md).

## Status

This repository now has an initial monorepo scaffold, CLI skeleton, base TanStack Start + Cloudflare Workers template, D1 + Drizzle module, Better Auth module, protected auth pages, generated-app smoke tests, auth browser smoke checks, and a CI workflow. The next milestone is running a real Cloudflare deployment pass and then adding the first post-MVP modules.
