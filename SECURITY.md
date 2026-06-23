# Security Policy

ShipStack is an early open-source SaaS starter. Please report security issues
privately so maintainers have time to investigate before details become public.

## Supported Versions

Security reports are currently accepted for the latest code on the default
branch and the latest published release candidate.

## Reporting A Vulnerability

Do not open a public GitHub issue for suspected vulnerabilities.

Until a dedicated security contact is published, report vulnerabilities by
creating a private advisory in GitHub if available, or by contacting the
repository maintainer through the private channel listed on the repository
profile.

Please include:

- affected package, template, module, or generated app path
- reproduction steps
- expected impact
- whether secrets, auth sessions, database rows, uploaded files, or API routes are involved
- suggested fix, if you have one

## Scope

Security-sensitive areas include:

- Better Auth session handling
- protected routes and server functions
- API identity and authorization
- Cloudflare Worker secrets and `.dev.vars`
- D1 migrations and user-owned data
- future billing webhooks, R2 uploads, and API keys

Never include real secrets, tokens, session cookies, private user data, or
production database IDs in reports, issues, pull requests, or tests.
