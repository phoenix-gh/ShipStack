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

Status: pending

- Date:
- Commit:
- Maintainer:
- Wrangler account check:

  ```sh
  pnpm dlx wrangler whoami
  ```

- Worker URL:
- Deploy command:

  ```sh
  pnpm deploy
  ```

- Route verification command:

  ```sh
  pnpm verify:deployed https://<your-worker-url>
  ```

- Result:
- Notes:

## GitHub Actions Evidence

Status: passed

- Date: 2026-06-28
- Commit: d9c5c45
- Workflow: CI
- Run URL: https://github.com/phoenix-gh/ShipStack/actions/runs/28318813137
- Result: passed
- Notes: Verified `pnpm verify:release` on the remote `master` branch after
  fixing fresh-clone package typecheck ordering and stabilizing auth browser
  smoke checks.

## npm Publish Workflow Dry-Run Evidence

Status: pending

- Date:
- Commit:
- Workflow:
- Run URL:
- Input:

  ```text
  dry_run: true
  ```

- Result:
- Packages checked:
  - `@shipstack/core`
  - `@shipstack/cli`
  - `create-shipstack`
- Notes:

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
