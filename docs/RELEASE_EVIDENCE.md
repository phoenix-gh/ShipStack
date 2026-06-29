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
  - `@shipstack-dev/core`
  - `@shipstack-dev/cli`
  - `create-shipstack-app`
- Notes: The remote workflow ran `pnpm verify:release` and completed
  `npm publish --dry-run --provenance --tag next` for all publishable packages,
  including the available `create-shipstack-app` package name.

## npm Publish Workflow Real Publish Attempt

Status: blocked

- Date: 2026-06-29
- Commit: 87f41a3
- Workflow: Release npm Packages
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28372735884
- Input:

  ```text
  dry_run: false
  npm_tag: next
  ```

- Result: blocked
- Packages checked after the failed run:
  - `@shipstack-dev/core@0.1.0-alpha.0`: not published
  - `@shipstack-dev/cli@0.1.0-alpha.0`: not published
  - `create-shipstack-app@0.1.0-alpha.0`: not published
- Notes: The workflow passed `pnpm verify:release`, then failed during the
  first real `npm publish` with `E404 Not Found - PUT
https://registry.npmjs.org/@shipstack%2fcore`. This was a different blocker
  than the earlier 2FA error: the updated `NPM_TOKEN` reached npm, but the
  original `@shipstack` scope is occupied by another owner. The publishable
  scoped packages have since moved to `@shipstack-dev/core` and
  `@shipstack-dev/cli`; rerun the workflow with an `NPM_TOKEN` that can publish
  in the `@shipstack-dev` scope.

Previous blocked attempts:

- 2026-06-30, commit `c5fae75`,
  https://github.com/phoenix-gh/ShipStack/actions/runs/28409426279: failed
  before publish during `pnpm verify:release` because the auth browser smoke
  reused a cleared session page while expecting an anonymous protected-route
  redirect. The targeted local auth smoke passed after switching that check to a
  fresh browser page.
- 2026-06-29, commit `0d8cbf4`,
  https://github.com/phoenix-gh/ShipStack/actions/runs/28371537956: passed
  `pnpm verify:release`, then failed at `npm publish` for npm's publish-time 2FA
  bypass requirement.
- 2026-06-28, commit `907a86e`,
  https://github.com/phoenix-gh/ShipStack/actions/runs/28325638587: passed
  `pnpm verify:release`, then failed at `npm publish` for the same npm 2FA
  bypass requirement.
- 2026-06-29, commit `9baf21b`,
  https://github.com/phoenix-gh/ShipStack/actions/runs/28370661628: failed
  before publish during `pnpm verify:release` because of a flaky auth browser
  smoke text assertion. Fixed by `0d8cbf4`.

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
