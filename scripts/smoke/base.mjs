import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  runSmoke,
  verifyGeneratedApp,
  verifyRuntimeRoutes,
} from "./lib.mjs";

await runSmoke("base", async (workspace) => {
  const appDir = await createApp(workspace, "base-app");
  const devVarsPath = resolve(appDir, ".dev.vars");

  await verifyGeneratedApp(appDir, { build: false });
  try {
    await verifyRuntimeRoutes(
      appDir,
      [
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
          path: "/api/health",
          headers: {
            origin: "https://trusted.example",
          },
          responseHeaders: {
            "access-control-allow-origin": "https://trusted.example",
          },
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
      ],
      {
        beforeStart: async () => {
          await writeFile(
            devVarsPath,
            'SHIPSTACK_TRUSTED_ORIGINS="https://trusted.example"\n',
          );
        },
      },
    );
  } finally {
    await rm(devVarsPath, { force: true });
  }

  await verifyRuntimeRoutes(appDir, [
    {
      path: "/api/health",
      headers: {
        origin: "https://untrusted.example",
      },
      responseHeaders: {
        "access-control-allow-origin": null,
      },
      status: 200,
    },
  ]);
  await verifyGeneratedApp(appDir, { install: false, test: false });
});
