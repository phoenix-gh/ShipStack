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
  await verifyGeneratedEnvFiles(appDir);
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
  const chineseEnvDoc = await readFile(
    resolve(appDir, "docs/zh-CN/env.md"),
    "utf8",
  );
  const chineseDeploymentDoc = await readFile(
    resolve(appDir, "docs/zh-CN/deployment.md"),
    "utf8",
  );

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

  if (!readme.includes("中文部署文档")) {
    throw new Error("Generated README should link Chinese generated docs");
  }

  if (!chineseEnvDoc.includes("SHIPSTACK_TRUSTED_ORIGINS")) {
    throw new Error("Generated Chinese env docs are missing trusted origins");
  }

  if (!chineseDeploymentDoc.includes("pnpm verify:deployed")) {
    throw new Error("Generated Chinese deployment docs are missing verifier");
  }
}

async function verifyGeneratedEnvFiles(appDir) {
  const envExample = await readFile(resolve(appDir, ".env.example"), "utf8");
  const devVarsExample = await readFile(
    resolve(appDir, ".dev.vars.example"),
    "utf8",
  );
  const gitignore = await readFile(resolve(appDir, ".gitignore"), "utf8");

  if (!envExample.includes("VITE_APP_NAME")) {
    throw new Error("Generated .env.example is missing VITE_APP_NAME");
  }

  if (!devVarsExample.includes("SHIPSTACK_TRUSTED_ORIGINS")) {
    throw new Error(
      "Generated .dev.vars.example is missing SHIPSTACK_TRUSTED_ORIGINS",
    );
  }

  for (const ignoredFile of [".env", ".env.*", ".dev.vars", ".dev.vars.*"]) {
    if (!gitignore.includes(ignoredFile)) {
      throw new Error(`Generated .gitignore is missing ${ignoredFile}`);
    }
  }
}
