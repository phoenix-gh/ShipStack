## Summary

-

## Verification

Run the checks that match the change:

- [ ] `pnpm format:check`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm verify:local`
- [ ] `pnpm smoke` for template, module, CLI, generated app, or package changes
- [ ] `pnpm publish:dry-run` for release or npm package changes
- [ ] `pnpm smoke:temporary-deploy` only when a maintainer approves an external Cloudflare temporary upload
- [ ] Real Cloudflare deploy, remote GitHub Actions, or remote npm workflow checks recorded when this is a release PR

## Documentation

- [ ] English docs updated, or not needed
- [ ] Chinese docs updated, or not needed
- [ ] `docs/PROGRESS.md` updated when status changed

## Safety

- [ ] No real secrets, tokens, private user data, or production IDs are included
- [ ] No paid or private starter code, docs, assets, or implementation details were copied
