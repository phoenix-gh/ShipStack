# Legal And Competitive Boundaries

ShipStack must stay independent from paid or private boilerplate projects.

## Core Rule

Do not copy paid boilerplate code, private repository structure, proprietary assets, private documentation, naming, templates, prompts, or implementation details.

ShipStack may learn from public market signals and public documentation only at the level of:

- user problems
- feature categories
- setup pain points
- open ecosystem gaps
- publicly documented integration requirements

ShipStack implementation must be original.

## TanStack vs TanStarter

TanStack Start and TanStack Router are open-source TanStack projects.

TanStarter is a separate third-party paid SaaS boilerplate.

ShipStack can use open-source TanStack packages. ShipStack must not copy TanStarter's private code, private repository, proprietary templates, paid assets, or unique product expression.

## Allowed References

Allowed:

- official open-source project documentation
- official package documentation
- open-source repositories and examples under compatible licenses
- public provider docs such as Cloudflare, Stripe, Drizzle, Better Auth, and TanStack docs
- public product pages used only to understand market positioning

## Disallowed References

Disallowed:

- code from paid/private boilerplates
- files from private repositories
- leaked source code
- proprietary templates
- private customer-only documentation
- copied marketing copy
- copied UI layouts or assets
- reverse-engineered implementation details from a paid product

## Implementation Standard

When building a feature that overlaps with a paid boilerplate, use first principles:

1. Start from the user problem.
2. Consult official open-source or provider documentation.
3. Implement using ShipStack's architecture.
4. Write original docs and examples.
5. Add tests or smoke checks.

## Naming Standard

Avoid names that create confusion with paid products.

Do not use:

- TanStarter
- MkFast
- names that imply affiliation with a paid starter

Use:

- ShipStack
- explicit module names such as `database-d1`, `auth-better-auth`, `billing-stripe`, `storage-r2`, and `api-keys`
