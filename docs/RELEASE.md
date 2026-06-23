# Release Checklist

This checklist is for maintainers preparing the first ShipStack release.

## v0.1.0 Gate

Do not tag `v0.1.0` until these checks are complete:

1. Confirm the worktree is clean.

   ```sh
   git status --short
   ```

2. Run local release verification.

   ```sh
   pnpm verify:release
   ```

3. Run the optional external temporary deploy smoke.

   ```sh
   pnpm smoke:temporary-deploy
   ```

4. Run the real Cloudflare account deploy checklist in
   [Deployment Verification](./DEPLOYMENT.md).

5. Confirm the remote GitHub Actions workflow passes on the release branch.

6. Record the real deployed Worker verification result in
   [Deployment Verification](./DEPLOYMENT.md) or
   [v0.1.0 release notes](./releases/v0.1.0.md).

7. Confirm release notes include:

   - supported Node.js version
   - supported pnpm version
   - required Cloudflare setup
   - verification commands
   - known limitations
   - next planned modules

8. Create the release tag.

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

## Pre-Release Safety Checks

- No real secrets, tokens, session cookies, or production IDs are committed.
- No private or paid starter code, docs, assets, prompts, or implementation details were copied.
- English and Chinese docs are updated for user-visible changes.
- Generated-app behavior is verified through smoke tests after template or module changes.
- `docs/PROGRESS.md` matches the current release status.

## Current Known External Gaps

This workspace cannot complete the final release gate until:

- Wrangler is authenticated with a real Cloudflare account.
- A git remote exists and GitHub Actions can be checked remotely.

The temporary Cloudflare deploy smoke is useful evidence, but it does not
replace the real-account deployment pass.
