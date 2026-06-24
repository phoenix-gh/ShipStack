import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
      await runSilently(["doctor"]);

      const originalWrangler = await readFile("wrangler.jsonc", "utf8");
      await writeFile(
        "wrangler.jsonc",
        `${JSON.stringify({ ...wrangler, d1_databases: [] }, null, 2)}\n`,
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("wrangler.jsonc", originalWrangler);

      const envExample = await readFile(".env.example", "utf8");
      assert.equal(count(envExample, "CLOUDFLARE_ACCOUNT_ID"), 1);

      const databaseReadme = await readFile("README.md", "utf8");
      assert.equal(count(databaseReadme, "[Database](./docs/database.md)"), 1);
      assert.equal(
        count(databaseReadme, "[数据库](./docs/zh-CN/database.md)"),
        1,
      );

      const databaseAgents = await readFile("AGENTS.md", "utf8");
      assert.equal(count(databaseAgents, "## Database Module"), 1);
      await writeFile(
        "AGENTS.md",
        databaseAgents.replace("## Database Module", "## Missing Module"),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("AGENTS.md", databaseAgents);

      await runSilently(["add", "auth"]);
      await runSilently(["add", "auth"]);

      const authPackageJson = JSON.parse(
        await readFile("package.json", "utf8"),
      );
      assert.equal(authPackageJson.dependencies["better-auth"], "^1.6.20");

      const devVarsExample = await readFile(".dev.vars.example", "utf8");
      assert.equal(count(devVarsExample, "BETTER_AUTH_SECRET"), 1);
      assert.equal(count(devVarsExample, "GOOGLE_CLIENT_ID"), 1);
      assert.equal(count(devVarsExample, "GOOGLE_CLIENT_SECRET"), 1);

      const drizzleConfig = await readFile("drizzle.config.ts", "utf8");
      assert.equal(count(drizzleConfig, "./src/db/auth-schema.ts"), 1);

      const authAgents = await readFile("AGENTS.md", "utf8");
      assert.equal(count(authAgents, "## Database Module"), 1);
      assert.equal(count(authAgents, "## Auth Module"), 1);
      assert.match(authAgents, /src\/features\/auth\/route-guards\.ts/);

      const authReadme = await readFile("README.md", "utf8");
      assert.equal(count(authReadme, "[Database](./docs/database.md)"), 1);
      assert.equal(count(authReadme, "[Authentication](./docs/auth.md)"), 1);
      assert.equal(count(authReadme, "[认证](./docs/zh-CN/auth.md)"), 1);
      await writeFile(
        "AGENTS.md",
        authAgents.replace("## Auth Module", "## Missing Auth Module"),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("AGENTS.md", authAgents);
      await runSilently(["doctor"]);
    });
  });
});

test("doctor reports missing project files", async () => {
  await withWorkspace(async () => {
    await assert.rejects(() => runSilently(["doctor"]), /4 check\(s\) failed/);
  });
});

test("api module command explains that the API foundation is built in", async () => {
  await withWorkspace(async (workspace) => {
    await runSilently(["create", "api-app"]);
    const appDir = resolve(workspace, "api-app");

    await withCwd(appDir, async () => {
      const output = await captureOutput(["add", "api"]);

      assert.match(output, /API foundation is already included/);
      assert.match(output, /\/api\/v1\/me/);
      assert.match(output, /trusted-origin CORS/);
    });
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
  await captureOutput(argv);
}

async function captureOutput(argv) {
  const originalLog = console.log;
  const originalError = console.error;
  let output = "";

  console.log = (...args) => {
    output += `${args.join(" ")}\n`;
  };
  console.error = (...args) => {
    output += `${args.join(" ")}\n`;
  };

  try {
    await runCli(argv);
    return output;
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

function count(value, pattern) {
  return value.split(pattern).length - 1;
}
