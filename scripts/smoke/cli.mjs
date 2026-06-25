import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  createShipStackBin,
  run,
  runAndCapture,
  runSmoke,
  shipStackBin,
} from "./lib.mjs";

await runSmoke("cli", async (workspace) => {
  const appDir = await createApp(workspace, "cli-app");

  await expectFailure(
    ["node", [shipStackBin, "add", "auth"]],
    appDir,
    "requires the database module",
  );

  await run("node", [shipStackBin, "doctor"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await assertDatabaseModule(appDir);

  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await assertAuthModule(appDir);

  await run("node", [shipStackBin, "add", "storage"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "storage"], { cwd: appDir });
  await assertStorageModule(appDir);

  await run("node", [shipStackBin, "add", "billing"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "billing"], { cwd: appDir });
  await assertBillingModule(appDir);

  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await assertApiKeysModule(appDir);

  await expectFailure(
    ["node", [createShipStackBin, "cli-app"]],
    workspace,
    "Target directory already exists",
  );
});

async function assertDatabaseModule(appDir) {
  const packageJson = JSON.parse(
    await readFile(resolve(appDir, "package.json"), "utf8"),
  );
  assertEqual(packageJson.dependencies["drizzle-orm"], "^0.45.2");
  assertEqual(packageJson.devDependencies["drizzle-kit"], "^0.31.10");
  assertEqual(
    packageJson.scripts["db:cf:migrate:local"],
    "wrangler d1 migrations apply DB --local",
  );

  const envExample = await readFile(resolve(appDir, ".env.example"), "utf8");
  assertCount(envExample, "CLOUDFLARE_ACCOUNT_ID", 1);

  const agents = await readFile(resolve(appDir, "AGENTS.md"), "utf8");
  assertCount(agents, "## Database Module", 1);

  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  assertCount(readme, "[Database](./docs/database.md)", 1);
  assertCount(readme, "[数据库](./docs/zh-CN/database.md)", 1);

  const wrangler = JSON.parse(
    await readFile(resolve(appDir, "wrangler.jsonc"), "utf8"),
  );
  const dbBindings = wrangler.d1_databases.filter(
    (binding) => binding.binding === "DB",
  );
  assertEqual(dbBindings.length, 1);
}

async function assertAuthModule(appDir) {
  const packageJson = JSON.parse(
    await readFile(resolve(appDir, "package.json"), "utf8"),
  );
  assertEqual(packageJson.dependencies["better-auth"], "^1.6.20");

  const devVarsExample = await readFile(
    resolve(appDir, ".dev.vars.example"),
    "utf8",
  );
  assertCount(devVarsExample, "BETTER_AUTH_SECRET", 1);

  const drizzleConfig = await readFile(
    resolve(appDir, "drizzle.config.ts"),
    "utf8",
  );
  assertCount(drizzleConfig, "./src/db/auth-schema.ts", 1);

  const rootRoute = await readFile(
    resolve(appDir, "src/routes/__root.tsx"),
    "utf8",
  );
  assertCount(rootRoute, 'to="/sign-in"', 1);

  const agents = await readFile(resolve(appDir, "AGENTS.md"), "utf8");
  assertCount(agents, "## Database Module", 1);
  assertCount(agents, "## Auth Module", 1);
  if (!agents.includes("src/features/auth/route-guards.ts")) {
    throw new Error("Expected AGENTS.md to mention auth route guards");
  }

  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  assertCount(readme, "[Database](./docs/database.md)", 1);
  assertCount(readme, "[Authentication](./docs/auth.md)", 1);
  assertCount(readme, "[认证](./docs/zh-CN/auth.md)", 1);
}

async function assertStorageModule(appDir) {
  const wrangler = JSON.parse(
    await readFile(resolve(appDir, "wrangler.jsonc"), "utf8"),
  );
  const r2Bindings = wrangler.r2_buckets.filter(
    (binding) => binding.binding === "FILES",
  );
  assertEqual(r2Bindings.length, 1);
  assertEqual(r2Bindings[0].bucket_name, "shipstack-files");

  const drizzleConfig = await readFile(
    resolve(appDir, "drizzle.config.ts"),
    "utf8",
  );
  assertCount(drizzleConfig, "./src/db/storage-schema.ts", 1);

  const agents = await readFile(resolve(appDir, "AGENTS.md"), "utf8");
  assertCount(agents, "## Storage Module", 1);
  if (!agents.includes("src/features/storage/server.ts")) {
    throw new Error("Expected AGENTS.md to mention storage server helpers");
  }

  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  assertCount(readme, "[Storage](./docs/storage.md)", 1);
  assertCount(readme, "[存储](./docs/zh-CN/storage.md)", 1);
}

async function assertBillingModule(appDir) {
  const devVarsExample = await readFile(
    resolve(appDir, ".dev.vars.example"),
    "utf8",
  );
  assertCount(devVarsExample, "STRIPE_SECRET_KEY", 1);
  assertCount(devVarsExample, "STRIPE_WEBHOOK_SECRET", 1);
  assertCount(devVarsExample, "STRIPE_PRICE_ID", 1);

  const drizzleConfig = await readFile(
    resolve(appDir, "drizzle.config.ts"),
    "utf8",
  );
  assertCount(drizzleConfig, "./src/db/billing-schema.ts", 1);

  const agents = await readFile(resolve(appDir, "AGENTS.md"), "utf8");
  assertCount(agents, "## Billing Module", 1);
  if (!agents.includes("src/features/billing/server.ts")) {
    throw new Error("Expected AGENTS.md to mention billing server helpers");
  }

  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  assertCount(readme, "[Billing](./docs/billing.md)", 1);
  assertCount(readme, "[支付](./docs/zh-CN/billing.md)", 1);
}

async function assertApiKeysModule(appDir) {
  const drizzleConfig = await readFile(
    resolve(appDir, "drizzle.config.ts"),
    "utf8",
  );
  assertCount(drizzleConfig, "./src/db/api-keys-schema.ts", 1);

  const agents = await readFile(resolve(appDir, "AGENTS.md"), "utf8");
  assertCount(agents, "## API Keys Module", 1);
  if (!agents.includes("src/features/api-keys/server.ts")) {
    throw new Error("Expected AGENTS.md to mention API keys server helpers");
  }

  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  assertCount(readme, "[API Keys](./docs/api-keys.md)", 1);
  assertCount(readme, "[API Keys](./docs/zh-CN/api-keys.md)", 1);
}

async function expectFailure([command, args], cwd, expectedOutput) {
  const result = await runAndCapture(command, args, { cwd });

  if (result.code === 0) {
    throw new Error(`Expected command to fail: ${command} ${args.join(" ")}`);
  }

  if (!result.output.includes(expectedOutput)) {
    throw new Error(
      `Expected failure output to include "${expectedOutput}". Received:\n${result.output}`,
    );
  }
}

function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function assertCount(content, marker, expected) {
  const actual = content.split(marker).length - 1;
  assertEqual(actual, expected);
}
