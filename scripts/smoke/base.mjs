import {
  createApp,
  runSmoke,
  verifyGeneratedApp,
  verifyRuntimeRoutes,
} from "./lib.mjs";

await runSmoke("base", async (workspace) => {
  const appDir = await createApp(workspace, "base-app");
  await verifyGeneratedApp(appDir, { build: false });
  await verifyRuntimeRoutes(appDir, [
    {
      path: "/",
      status: 200,
      includes: "ShipStack",
    },
    {
      path: "/health",
      status: 200,
      includes: "System health is ok.",
    },
    {
      path: "/api/health",
      status: 200,
      json: (body) => {
        if (body.data?.status !== "ok" || body.error !== null) {
          throw new Error("/api/health returned an unexpected envelope");
        }
      },
    },
    {
      path: "/api/v1/me",
      status: 200,
      json: (body) => {
        if (body.data?.authenticated !== false || body.error !== null) {
          throw new Error(
            "/api/v1/me returned an unexpected anonymous envelope",
          );
        }
      },
    },
  ]);
  await verifyGeneratedApp(appDir, { install: false, test: false });
});
