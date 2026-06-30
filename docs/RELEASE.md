# Release Checklist

This checklist is for maintainers preparing the first ShipStack release.

## Alpha Release Status

`v0.1.0-alpha.0` has been published:

- GitHub release: https://github.com/phoenix-gh/ShipStack/releases/tag/v0.1.0-alpha.0
- npm packages:
  - `@shipstack-dev/core@0.1.0-alpha.0`
  - `@shipstack-dev/cli@0.1.0-alpha.0`
  - `create-shipstack-app@0.1.0-alpha.0`

The repository is public so npm provenance can verify GitHub Actions source
metadata.

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

10. Verify first-run install from the published alpha packages.

    ```sh
    pnpm create shipstack-app my-app
    cd my-app
    pnpm install
    shipstack doctor
    ```

    Install the first-party modules, run the generated app checks, and record
    any fix or known limitation before tagging stable `v0.1.0`.

11. Create the release tag.

    ```sh
    git tag v0.1.0
    git push origin v0.1.0
    ```

12. Publish npm packages from GitHub Actions.

    Use the `Release npm Packages` workflow after CI passes on the tag or
    release branch. Run it once with `dry_run: true`, inspect the output, then
    run it with `dry_run: false` when ready.

    Packages are published in dependency order:

    - `@shipstack-dev/core`
    - `@shipstack-dev/cli`
    - `create-shipstack-app`

    The workflow requires the repository secret `NPM_TOKEN`, publishes with npm
    provenance enabled, and requires publishable package `repository.url`
    metadata to match the public GitHub repository.

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
   checks `@shipstack-dev/core`, `@shipstack-dev/cli`, and `create-shipstack-app`, then
   record the run URL and result in [Release Evidence](./RELEASE_EVIDENCE.md).

6. Configure the npm publishing token.

   Create an npm granular access token that can publish `@shipstack-dev/core`,
   `@shipstack-dev/cli`, and `create-shipstack-app`. Store it as the GitHub
   repository secret `NPM_TOKEN`.

   If npm two-factor authentication is enabled for publishing, make sure the
   token is explicitly allowed to bypass 2FA. A classic automation token or a
   granular token without publish and 2FA bypass permissions is not enough for
   the real publish workflow.

7. Rerun the full audit.

   ```sh
   pnpm release:audit
   ```

   The release is not ready to tag until this command passes with no local
   failures and no external blockers.

## Current Known External Gaps

The external release gates have been recorded for the alpha release:

- real Cloudflare account deploy verification
- remote GitHub Actions CI
- remote npm publish workflow dry-run
- real npm publish with provenance
- GitHub prerelease tag

Before tagging stable `v0.1.0`, rerun `pnpm release:audit` on the release
commit, confirm the latest remote CI remains green, and repeat first-run
verification from the published alpha packages. The temporary Cloudflare deploy
smoke is useful extra evidence, but it does not replace the real-account
deployment pass.
