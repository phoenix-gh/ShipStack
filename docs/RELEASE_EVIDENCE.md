# Release Evidence

Use this file when preparing a ShipStack release. Record links and command
results for external gates here, then update `docs/PROGRESS.md` and
`docs/releases/v0.1.0.md` with the final status.

Do not paste secrets, API tokens, session cookies, account IDs that should stay
private, or full environment files.

## Required Fields

The full release audit treats these sections as external gates. A section only
passes when `Status` is not `pending` and the required fields below are filled:

- Real Cloudflare Deploy Evidence: Date, Commit, Worker URL, Result
- GitHub Actions Evidence: Date, Commit, Run URL, Result
- npm Publish Workflow Dry-Run Evidence: Date, Commit, Run URL, Result

## Real Cloudflare Deploy Evidence

Status: passed

- Date: 2026-06-28
- Commit: 86578a9
- Maintainer: phoenix-gh
- Wrangler account check: passed

  ```sh
  pnpm dlx wrangler whoami
  ```

- Worker URL: https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
- Deploy command:

  ```sh
  pnpm run deploy
  ```

- Route verification command:

  ```sh
  pnpm verify:deployed https://shipstack-real-deploy-app-20260628.fong-250.workers.dev
  ```

- Result: passed
- Notes: Generated a fresh base app at `/tmp/shipstack-real-deploy-app-20260628`,
  ran dependency install, generated-app verification, real Cloudflare Workers
  deploy, and deployed route verification. Do not commit Cloudflare account IDs.

## GitHub Actions Evidence

Status: passed

- Date: 2026-06-28
- Commit: 86578a9
- Workflow: CI
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28320940187
- Result: passed
- Notes: Verified `pnpm verify:release` on the remote `master` branch after
  fixing generated absolute-path app names, generated deploy commands, the
  publishable create package name, and auth browser smoke navigation timing.

## npm Publish Workflow Dry-Run Evidence

Status: passed

- Date: 2026-06-28
- Commit: 86578a9
- Workflow: Release npm Packages
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28320946840
- Input:

  ```text
  dry_run: true
  npm_tag: next
  ```

- Result: passed
- Packages checked:
  - `@shipstack/core`
  - `@shipstack/cli`
  - `create-shipstack-app`
- Notes: The remote workflow ran `pnpm verify:release` and completed
  `npm publish --dry-run --provenance --tag next` for all publishable packages,
  including the available `create-shipstack-app` package name.

## npm Publish Workflow Real Publish Attempt

Status: blocked

- Date: 2026-06-28
- Commit: 907a86e
- Workflow: Release npm Packages
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28325638587
- Input:

  ```text
  dry_run: false
  npm_tag: next
  ```

- Result: blocked
- Packages checked after the failed run:
  - `@shipstack/core@0.1.0-alpha.0`: not published
  - `@shipstack/cli@0.1.0-alpha.0`: not published
  - `create-shipstack-app@0.1.0-alpha.0`: not published
- Notes: The workflow passed `pnpm verify:release` and failed during the first
  real `npm publish` because npm requires two-factor authentication or a
  granular access token with bypass 2FA enabled. Replace `NPM_TOKEN` with a
  publish-capable granular token, then rerun the workflow.

## Optional Temporary Cloudflare Deploy Evidence

Status: pending

- Date:
- Commit:
- Command:

  ```sh
  pnpm smoke:temporary-deploy
  ```

- Temporary Worker URL:
- Result:
- Notes:
