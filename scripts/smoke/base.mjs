import { createApp, runSmoke, verifyGeneratedApp } from "./lib.mjs";

await runSmoke("base", async (workspace) => {
  const appDir = await createApp(workspace, "base-app");
  await verifyGeneratedApp(appDir);
});
