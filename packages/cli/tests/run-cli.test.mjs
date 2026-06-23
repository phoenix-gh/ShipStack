import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { runCli } from "../dist/run-cli.js";

test("database and auth installers patch generated apps idempotently", async () => {
  await withWorkspace(async (workspace) => {
    await runSilently(["create", "unit-app"]);
    const appDir = resolve(workspace, "unit-app");

    await withCwd(appDir, async () => {
      await assert.rejects(
        () => runSilently(["add", "auth"]),
        /requires the database module/,
      );

      await runSilently(["add", "database"]);
      await runSilently(["add", "database"]);

      const packageJson = JSON.parse(await readFile("package.json", "utf8"));
      assert.equal(packageJson.dependencies["drizzle-orm"], "^0.45.2");
      assert.equal(packageJson.scripts["db:generate"], "drizzle-kit generate");
      assert.equal(
        packageJson.scripts["db:cf:migrate:remote"],
        "wrangler d1 migrations apply DB --remote",
      );

      const wrangler = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
      const d1Bindings = wrangler.d1_databases.filter(
        (binding) => binding.binding === "DB",
      );
      assert.equal(d1Bindings.length, 1);
      assert.equal(d1Bindings[0].migrations_dir, "drizzle/migrations");

      const envExample = await readFile(".env.example", "utf8");
      assert.equal(count(envExample, "CLOUDFLARE_ACCOUNT_ID"), 1);

      await runSilently(["add", "auth"]);
      await runSilently(["add", "auth"]);

      const authPackageJson = JSON.parse(
        await readFile("package.json", "utf8"),
      );
      assert.equal(authPackageJson.dependencies["better-auth"], "^1.6.20");

      const devVarsExample = await readFile(".dev.vars.example", "utf8");
      assert.equal(count(devVarsExample, "BETTER_AUTH_SECRET"), 1);

      const drizzleConfig = await readFile("drizzle.config.ts", "utf8");
      assert.equal(count(drizzleConfig, "./src/db/auth-schema.ts"), 1);
    });
  });
});

test("doctor reports missing project files", async () => {
  await withWorkspace(async () => {
    await assert.rejects(() => runSilently(["doctor"]), /4 check\(s\) failed/);
  });
});

async function withWorkspace(callback) {
  const workspace = await mkdtemp(resolve(tmpdir(), "shipstack-cli-unit-"));

  try {
    await withCwd(workspace, () => callback(workspace));
  } finally {
    await rm(workspace, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 500,
    });
  }
}

async function withCwd(directory, callback) {
  const previous = process.cwd();
  process.chdir(directory);

  try {
    return await callback();
  } finally {
    process.chdir(previous);
  }
}

async function runSilently(argv) {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};

  try {
    await runCli(argv);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function count(value, pattern) {
  return value.split(pattern).length - 1;
}
