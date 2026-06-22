import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
} from "./lib.mjs";

await runSmoke("database", async (workspace) => {
  const appDir = await createApp(workspace, "database-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });

  await verifyGeneratedApp(appDir);
});
