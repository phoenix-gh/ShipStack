import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
  withDevServer,
} from "./lib.mjs";

await runSmoke("openapi", async (workspace) => {
  const appDir = await createApp(workspace, "openapi-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "storage"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "billing"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "openapi"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "openapi"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-rate-limit"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-rate-limit"], { cwd: appDir });
  await verifyOpenApiDocs(appDir);

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["openapi:generate"], { cwd: appDir });
  await verifyGeneratedSpec(appDir);
  await verifyGeneratedApp(appDir, { install: false });
  await verifyOpenApiRuntime(appDir);
});

async function verifyOpenApiDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseOpenApiDoc = await readFile(
    resolve(appDir, "docs/zh-CN/openapi.md"),
    "utf8",
  );

  if (!readme.includes("[OpenAPI](./docs/openapi.md)")) {
    throw new Error("Generated README is missing OpenAPI module docs link");
  }

  if (!readme.includes("[OpenAPI](./docs/zh-CN/openapi.md)")) {
    throw new Error(
      "Generated README is missing Chinese OpenAPI module docs link",
    );
  }

  if (!chineseOpenApiDoc.includes("pnpm openapi:generate")) {
    throw new Error(
      "Generated Chinese OpenAPI docs are missing generation guidance",
    );
  }
}

async function verifyGeneratedSpec(appDir) {
  const spec = JSON.parse(
    await readFile(resolve(appDir, "public/openapi.json"), "utf8"),
  );
  const generatedModule = await readFile(
    resolve(appDir, "src/features/openapi/generated.ts"),
    "utf8",
  );

  assertPath(spec, "/api/health");
  assertPath(spec, "/api/v1/me");
  assertPath(spec, "/api/v1/api-keys");
  assertPath(spec, "/api/v1/files");
  assertPath(spec, "/api/v1/billing/status");
  assertPath(spec, "/api/v1/billing/checkout");
  assertPath(spec, "/api/v1/billing/portal");
  assertPath(spec, "/api/stripe/webhook");

  if (!spec.paths["/api/v1/me"].get.responses["429"]) {
    throw new Error("Expected OpenAPI spec to include rate limit response");
  }

  if (!generatedModule.includes('"/api/v1/api-keys"')) {
    throw new Error("Generated OpenAPI TypeScript module is missing API keys");
  }
}

async function verifyOpenApiRuntime(appDir) {
  await withDevServer(appDir, async (origin) => {
    const response = await fetch(`${origin}/api/openapi`);
    if (!response.ok) {
      throw new Error(
        `OpenAPI route failed ${response.status}: ${await response.text()}`,
      );
    }

    const spec = await response.json();
    assertPath(spec, "/api/health");
    assertPath(spec, "/api/v1/api-keys");
    assertPath(spec, "/api/v1/files");
    assertPath(spec, "/api/v1/billing/status");
  });
}

function assertPath(spec, path) {
  if (!spec.paths?.[path]) {
    throw new Error(`Expected OpenAPI spec to include ${path}`);
  }
}
