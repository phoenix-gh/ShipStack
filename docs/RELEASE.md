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

5. Run the local npm publish dry-run.

   ```sh
   pnpm publish:dry-run
   ```

   This command packs the publishable packages and runs `npm publish --dry-run`
   on each tarball. It does not publish packages and does not use provenance;
   the GitHub Actions workflow is still the source of truth for provenance.

6. Run the real Cloudflare account deploy checklist in
   [Deployment Verification](./DEPLOYMENT.md).

7. Confirm the remote GitHub Actions workflow passes on the release branch.

8. Record the real deployed Worker verification result in
   [Release Evidence](./RELEASE_EVIDENCE.md), then summarize the result in
   [Deployment Verification](./DEPLOYMENT.md) or
   [v0.1.0 release notes](./releases/v0.1.0.md).

9. Confirm release notes include:

   - supported Node.js version
   - supported pnpm version
   - required Cloudflare setup
   - verification commands
   - known limitations
   - next planned modules

10. Create the release tag.

    ```sh
    git tag v0.1.0
    git push origin v0.1.0
    ```

11. Publish npm packages from GitHub Actions.

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
- `pnpm publish:dry-run` verifies npm accepts the packed tarballs in dry-run
  mode before the remote workflow publishes them with provenance.
- `docs/RELEASE_EVIDENCE.md` records external gate links and command results
  without secrets.
- `docs/PROGRESS.md` matches the current release status.

## External Gate Runbook

Use this sequence when the local checks pass but `pnpm release:audit` still
reports external blockers.

1. Configure the git remote and push the release branch.

   ```sh
   git remote add origin <repository-url>
   git push -u origin HEAD
   ```

   If `origin` already exists, inspect it with `git remote -v` instead of
   replacing it blindly.

2. Confirm Wrangler is authenticated.

   ```sh
   pnpm dlx wrangler login
   pnpm dlx wrangler whoami
   ```

   Do not paste Cloudflare tokens or account IDs into committed files.

3. Run the real Cloudflare deploy pass from [Deployment Verification](./DEPLOYMENT.md).

   Record the deployed Worker URL and `pnpm verify:deployed` result in
   [Release Evidence](./RELEASE_EVIDENCE.md).

4. Confirm remote CI on GitHub.

   Open the pushed branch or pull request in GitHub Actions, confirm the CI
   workflow passed, then record the run URL and result in
   [Release Evidence](./RELEASE_EVIDENCE.md).

5. Run the npm publish workflow dry-run remotely.

   Use the `Release npm Packages` workflow with `dry_run: true`. Confirm it
   checks `@shipstack/core`, `@shipstack/cli`, and `create-shipstack`, then
   record the run URL and result in [Release Evidence](./RELEASE_EVIDENCE.md).

6. Rerun the full audit.

   ```sh
   pnpm release:audit
   ```

   The release is not ready to tag until this command passes with no local
   failures and no external blockers.

## Current Known External Gaps

The external release gates have been recorded for this release candidate:

- real Cloudflare account deploy verification
- remote GitHub Actions CI
- remote npm publish workflow dry-run

Before tagging, rerun `pnpm release:audit` on the release commit and confirm the
latest remote CI remains green. The temporary Cloudflare deploy smoke is useful
extra evidence, but it does not replace the real-account deployment pass.
