import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
} from "./lib.mjs";

await runSmoke("auth", async (workspace) => {
  const appDir = await createApp(workspace, "auth-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyGeneratedApp(appDir, { install: false });
});
