# Release Checklist

This checklist is for maintainers preparing the first ShipStack release.

## v0.1.0 Gate

Do not tag `v0.1.0` until these checks are complete:

1. Confirm the worktree is clean.

   ```sh
   git status --short
   ```

   You can also run the release gate audit for a quick local and external
   blocker summary:

   ```sh
   pnpm release:audit
   ```

2. Run local release verification.

   ```sh
   pnpm verify:release
   ```

3. Run the optional external temporary deploy smoke.

   ```sh
   pnpm smoke:temporary-deploy
   ```

4. Verify npm package contents.

   ```sh
   pnpm pack:check
   ```

5. Run the real Cloudflare account deploy checklist in
   [Deployment Verification](./DEPLOYMENT.md).

6. Confirm the remote GitHub Actions workflow passes on the release branch.

7. Record the real deployed Worker verification result in
   [Deployment Verification](./DEPLOYMENT.md) or
   [v0.1.0 release notes](./releases/v0.1.0.md).

8. Confirm release notes include:

   - supported Node.js version
   - supported pnpm version
   - required Cloudflare setup
   - verification commands
   - known limitations
   - next planned modules

9. Create the release tag.

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

10. Publish npm packages from GitHub Actions.

    Use the `Release npm Packages` workflow after CI passes on the tag or
    release branch. Run it once with `dry_run: true`, inspect the output, then
    run it with `dry_run: false` when ready.

    Packages are published in dependency order:

    - `@shipstack/core`
    - `@shipstack/cli`
    - `create-shipstack`

    The workflow requires the repository secret `NPM_TOKEN` and publishes with
    npm provenance enabled.

## Pre-Release Safety Checks

- No real secrets, tokens, session cookies, or production IDs are committed.
- No private or paid starter code, docs, assets, prompts, or implementation details were copied.
- English and Chinese docs are updated for user-visible changes.
- Generated-app behavior is verified through smoke tests after template or module changes.
- `pnpm pack:check` verifies package contents and creates an app from packed
  tarballs before publishing.
- `docs/PROGRESS.md` matches the current release status.

## Current Known External Gaps

This workspace cannot complete the final release gate until:

- Wrangler is authenticated with a real Cloudflare account.
- A git remote exists and GitHub Actions can be checked remotely.

The temporary Cloudflare deploy smoke is useful evidence, but it does not
replace the real-account deployment pass.
