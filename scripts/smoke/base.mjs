import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  run,
  runSmoke,
  verifyGeneratedApp,
  verifyRuntimeRoutes,
  withDevServer,
} from "./lib.mjs";

await runSmoke("base", async (workspace) => {
  const appDir = await createApp(workspace, "base-app");
  const devVarsPath = resolve(appDir, ".dev.vars");

  await verifyGeneratedMetadata(appDir);
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

  await withDevServer(appDir, async (origin) => {
    await run("pnpm", ["verify:deployed", origin], { cwd: appDir });
  });

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
  await run("pnpm", ["verify"], { cwd: appDir });
});

async function verifyGeneratedMetadata(appDir) {
  const packageJson = JSON.parse(
    await readFile(resolve(appDir, "package.json"), "utf8"),
  );
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");

  if (packageJson.name !== "base-app") {
    throw new Error(`Unexpected generated package name: ${packageJson.name}`);
  }

  if (
    packageJson.description !==
    "ShipStack app generated for TanStack Start on Cloudflare Workers."
  ) {
    throw new Error("Generated package description is missing or incorrect");
  }

  for (const expectedCommand of [
    "shipstack add database",
    "shipstack add auth",
  ]) {
    if (!readme.includes(expectedCommand)) {
      throw new Error(`Generated README is missing ${expectedCommand}`);
    }
  }
}
