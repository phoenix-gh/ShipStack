# Contributing

Thank you for helping make ShipStack a reliable open-source SaaS starter.

## Scope

ShipStack is currently focused on a minimal, verifiable Cloudflare-first MVP:

- TanStack Start
- Cloudflare Workers
- D1 and Drizzle
- Better Auth
- versioned API routes
- generated app smoke tests
- deployment documentation

Prefer changes that improve this path before adding broad product features.

## Before You Change Code

Read these documents first:

- [Project Design](./docs/PROJECT_DESIGN.md)
- [MVP Specification](./docs/MVP_SPEC.md)
- [Roadmap](./docs/ROADMAP.md)
- [Legal Boundaries](./docs/LEGAL_BOUNDARIES.md)
- [Testing](./docs/TESTING.md)

Avoid copying private boilerplates, paid starter templates, proprietary docs,
marketing copy, or implementation details.

## Development

Install dependencies:

```sh
pnpm install
```

Run the regular checks:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Run generated-app smoke tests after changing templates, modules, CLI behavior,
generated app scripts, or package versions:

```sh
pnpm smoke
```

Run the full release verification before release-oriented changes:

```sh
pnpm verify:release
```

Optional external deployment smoke:

```sh
pnpm smoke:temporary-deploy
```

This uses Cloudflare's temporary account flow. It is useful evidence, but it
does not replace a real-account deployment pass.

## Contribution Rules

- Keep the base starter minimal.
- Add features as modules or recipes when possible.
- Keep route files thin; put business logic in feature modules.
- Keep Cloudflare, auth, database, billing, and storage provider assumptions explicit.
- Include tests, smoke checks, or a documented manual verification path for behavior changes.
- Update English and Chinese documentation when user-facing behavior changes.
- Never commit real secrets.

## Commit Style

Use concise, conventional-style commit messages, for example:

```text
feat: add api key module manifest
fix: preserve wrangler bindings on install
test: cover auth module idempotency
docs: clarify cloudflare deployment
```

## Release Gates

Before tagging `v0.1.0`, maintainers should verify:

1. `pnpm verify:release` passes.
2. `pnpm smoke:temporary-deploy` passes.
3. A real Cloudflare account deploy has been completed and recorded.
4. The remote GitHub Actions workflow passes.
