import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
  withDevServer,
} from "./lib.mjs";

await runSmoke("api-rate-limit", async (workspace) => {
  const appDir = await createApp(workspace, "api-rate-limit-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-rate-limit"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-rate-limit"], { cwd: appDir });
  await verifyApiRateLimitDocs(appDir);

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyGeneratedApp(appDir, { install: false });
  await verifyApiRateLimitRuntime(appDir);
});

async function verifyApiRateLimitDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseDoc = await readFile(
    resolve(appDir, "docs/zh-CN/api-rate-limit.md"),
    "utf8",
  );

  if (!readme.includes("[API Rate Limit](./docs/api-rate-limit.md)")) {
    throw new Error("Generated README is missing API rate limit docs link");
  }

  if (!readme.includes("[API Rate Limit](./docs/zh-CN/api-rate-limit.md)")) {
    throw new Error(
      "Generated README is missing Chinese API rate limit docs link",
    );
  }

  if (!chineseDoc.includes("Cloudflare WAF")) {
    throw new Error(
      "Generated Chinese API rate limit docs are missing production boundary guidance",
    );
  }
}

async function verifyApiRateLimitRuntime(appDir) {
  const devVarsPath = resolve(appDir, ".dev.vars");

  try {
    await withDevServer(
      appDir,
      async (origin) => {
        let limitedResponse;

        for (let index = 0; index < 11; index += 1) {
          limitedResponse = await fetch(`${origin}/api/v1/me`, {
            headers: {
              "cf-connecting-ip": "203.0.113.99",
            },
          });
        }

        if (!limitedResponse || limitedResponse.status !== 429) {
          throw new Error(
            `Expected rate-limited response to return 429, received ${limitedResponse?.status}`,
          );
        }

        const body = await limitedResponse.json();
        if (body.error?.code !== "RATE_LIMITED") {
          throw new Error(
            `Expected RATE_LIMITED error envelope: ${JSON.stringify(body)}`,
          );
        }

        if (!limitedResponse.headers.get("retry-after")) {
          throw new Error(
            "Expected rate-limited response to include retry-after",
          );
        }
      },
      {
        beforeStart: async ({ origin }) => {
          await writeFile(
            devVarsPath,
            [
              'BETTER_AUTH_SECRET="api rate limit smoke auth secret for local tests only"',
              `BETTER_AUTH_URL="${origin}"`,
              "",
            ].join("\n"),
          );
        },
      },
    );
  } finally {
    await rm(devVarsPath, { force: true });
  }
}
