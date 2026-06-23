# Architecture Decisions

This file records current design decisions. Revisit decisions when implementation reveals better evidence.

## ADR 001: Cloudflare First

Decision: ShipStack defaults to Cloudflare Workers, D1, and R2.

Reasoning:

- Cloudflare has strong cost and deployment advantages for indie SaaS.
- The TanStack Start + Cloudflare ecosystem has less starter saturation than Next.js + Vercel.
- The hard parts are mostly integration and setup, which ShipStack can automate.

Consequence:

- The first user journey should optimize for Wrangler and Cloudflare resources.
- Provider-specific code must stay isolated enough for future adapters.

## ADR 002: TanStack Start As The App Framework

Decision: ShipStack uses TanStack Start as the first app framework.

Reasoning:

- It aligns with the target user segment looking beyond Next.js.
- It pairs well with Vite and Cloudflare Workers.
- Its ecosystem is young enough that production-oriented examples are valuable.

Consequence:

- Do not add framework abstraction in MVP.
- Keep route and server-function patterns consistent and documented.

## ADR 003: Modules Instead Of One Giant Template

Decision: ShipStack should be built around installable modules.

Reasoning:

- A giant template creates high cognitive load and high maintenance burden.
- Users should opt into billing, storage, API keys, admin, teams, and other features.
- Modules make recipes and community contributions easier.

Consequence:

- Core code should define module metadata and file operations early.
- Every module should own env vars, docs, tests, and setup checks.

## ADR 004: CLI As A First-Class Product Surface

Decision: ShipStack's CLI is a core differentiator, not a convenience wrapper.

Reasoning:

- Manual Cloudflare setup is one of the biggest pain points.
- Good diagnostics can make the project easier to trust.
- Idempotent commands reduce setup fear.

Consequence:

- CLI tests matter.
- Error messages should be specific and actionable.
- Resource creation commands should patch configuration safely.

## ADR 005: Better Auth First

Decision: Better Auth is the first authentication provider.

Reasoning:

- It is a modern auth library with good TypeScript ergonomics.
- It fits the TanStack ecosystem better than a Next.js-specific path.

Consequence:

- Auth should live behind small helpers so future auth changes remain possible.
- Generated auth examples should be boring and production-minded.

## ADR 006: Stripe First

Decision: Stripe is the first billing provider.

Reasoning:

- Stripe is widely used and expected in SaaS starters.
- Webhooks, checkout, and customer portal cover the common paid-product loop.

Consequence:

- Billing provider code should be isolated.
- Subscription state should be verified through webhooks, not client assumptions.

## ADR 007: Tests Are Part Of The Product

Decision: ShipStack modules must include verification paths.

Reasoning:

- Boilerplates often decay silently.
- Users need confidence that auth, migrations, webhooks, and storage still work.

Consequence:

- CI should build and test a generated project.
- Module changes should update smoke tests where behavior changes.
