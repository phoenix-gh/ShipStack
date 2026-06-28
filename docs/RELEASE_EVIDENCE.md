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
- Commit: 092160f
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
- Commit: 092160f
- Workflow: CI
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28319955653
- Result: passed
- Notes: Verified `pnpm verify:release` on the remote `master` branch after
  fixing generated absolute-path app names and generated deploy commands.

## npm Publish Workflow Dry-Run Evidence

Status: passed

- Date: 2026-06-28
- Commit: 092160f
- Workflow: Release npm Packages
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28319962801
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
  `npm publish --dry-run --provenance --tag next` for all publishable packages.

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
