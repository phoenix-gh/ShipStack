import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
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
      await runSilently(["doctor"]);

      const baseReadme = await readFile("README.md", "utf8");
      await writeFile(
        "README.md",
        baseReadme.replace("[Deployment]", "[Missing Deployment]"),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", baseReadme);

      const gitignore = await readFile(".gitignore", "utf8");
      await writeFile(".gitignore", gitignore.replace(".dev.vars.*", ""));
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile(".gitignore", gitignore);

      await unlink(".dev.vars.example");
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile(
        ".dev.vars.example",
        '# Local Worker runtime secrets go here.\n# Copy this file to .dev.vars for local development.\nSHIPSTACK_TRUSTED_ORIGINS=""\n',
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
      await writeFile(
        "README.md",
        databaseReadme.replace(
          "[Database](./docs/database.md)",
          "[Missing Database](./docs/database.md)",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", databaseReadme);

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
        "README.md",
        authReadme.replace(
          "[Authentication](./docs/auth.md)",
          "[Missing Auth](./docs/auth.md)",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", authReadme);
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

      await runSilently(["add", "storage"]);
      await runSilently(["add", "storage"]);

      const storageWrangler = JSON.parse(
        await readFile("wrangler.jsonc", "utf8"),
      );
      const r2Bindings = storageWrangler.r2_buckets.filter(
        (binding) => binding.binding === "FILES",
      );
      assert.equal(r2Bindings.length, 1);
      assert.equal(r2Bindings[0].bucket_name, "shipstack-files");

      const storageDrizzleConfig = await readFile("drizzle.config.ts", "utf8");
      assert.equal(
        count(storageDrizzleConfig, "./src/db/storage-schema.ts"),
        1,
      );

      const storageReadme = await readFile("README.md", "utf8");
      assert.equal(count(storageReadme, "[Storage](./docs/storage.md)"), 1);
      assert.equal(count(storageReadme, "[存储](./docs/zh-CN/storage.md)"), 1);

      const storageAgents = await readFile("AGENTS.md", "utf8");
      assert.equal(count(storageAgents, "## Storage Module"), 1);
      assert.match(storageAgents, /src\/features\/storage\/server\.ts/);
      await writeFile(
        "AGENTS.md",
        storageAgents.replace("## Storage Module", "## Missing Storage Module"),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("AGENTS.md", storageAgents);

      await writeFile(
        "README.md",
        storageReadme.replace(
          "[Storage](./docs/storage.md)",
          "[Missing Storage](./docs/storage.md)",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", storageReadme);
      await runSilently(["doctor"]);

      await runSilently(["add", "billing"]);
      await runSilently(["add", "billing"]);

      const billingDevVarsExample = await readFile(".dev.vars.example", "utf8");
      assert.equal(count(billingDevVarsExample, "STRIPE_SECRET_KEY"), 1);
      assert.equal(count(billingDevVarsExample, "STRIPE_WEBHOOK_SECRET"), 1);
      assert.equal(count(billingDevVarsExample, "STRIPE_PRICE_ID"), 1);

      const billingDrizzleConfig = await readFile("drizzle.config.ts", "utf8");
      assert.equal(
        count(billingDrizzleConfig, "./src/db/billing-schema.ts"),
        1,
      );

      const billingReadme = await readFile("README.md", "utf8");
      assert.equal(count(billingReadme, "[Billing](./docs/billing.md)"), 1);
      assert.equal(count(billingReadme, "[支付](./docs/zh-CN/billing.md)"), 1);

      const billingAgents = await readFile("AGENTS.md", "utf8");
      assert.equal(count(billingAgents, "## Billing Module"), 1);
      assert.match(billingAgents, /src\/features\/billing\/server\.ts/);
      await writeFile(
        "AGENTS.md",
        billingAgents.replace("## Billing Module", "## Missing Billing Module"),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("AGENTS.md", billingAgents);

      await writeFile(
        "README.md",
        billingReadme.replace(
          "[Billing](./docs/billing.md)",
          "[Missing Billing](./docs/billing.md)",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", billingReadme);
      await runSilently(["doctor"]);

      await runSilently(["add", "api-keys"]);
      await runSilently(["add", "api-keys"]);

      const apiKeysDrizzleConfig = await readFile("drizzle.config.ts", "utf8");
      assert.equal(
        count(apiKeysDrizzleConfig, "./src/db/api-keys-schema.ts"),
        1,
      );

      const apiKeysReadme = await readFile("README.md", "utf8");
      assert.equal(count(apiKeysReadme, "[API Keys](./docs/api-keys.md)"), 1);
      assert.equal(
        count(apiKeysReadme, "[API Keys](./docs/zh-CN/api-keys.md)"),
        1,
      );

      const apiKeysAgents = await readFile("AGENTS.md", "utf8");
      assert.equal(count(apiKeysAgents, "## API Keys Module"), 1);
      assert.match(apiKeysAgents, /src\/features\/api-keys\/server\.ts/);
      await writeFile(
        "AGENTS.md",
        apiKeysAgents.replace(
          "## API Keys Module",
          "## Missing API Keys Module",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("AGENTS.md", apiKeysAgents);

      await writeFile(
        "README.md",
        apiKeysReadme.replace(
          "[API Keys](./docs/api-keys.md)",
          "[Missing API Keys](./docs/api-keys.md)",
        ),
      );
      await assert.rejects(
        () => runSilently(["doctor"]),
        /1 check\(s\) failed/,
      );
      await writeFile("README.md", apiKeysReadme);
      await runSilently(["doctor"]);
    });
  });
});

test("storage installer requires database and auth modules", async () => {
  await withWorkspace(async (workspace) => {
    await runSilently(["create", "storage-app"]);
    const appDir = resolve(workspace, "storage-app");

    await withCwd(appDir, async () => {
      await assert.rejects(
        () => runSilently(["add", "storage"]),
        /requires the database module/,
      );

      await runSilently(["add", "database"]);

      await assert.rejects(
        () => runSilently(["add", "storage"]),
        /requires the auth module/,
      );
    });
  });
});

test("billing installer requires database and auth modules", async () => {
  await withWorkspace(async (workspace) => {
    await runSilently(["create", "billing-app"]);
    const appDir = resolve(workspace, "billing-app");

    await withCwd(appDir, async () => {
      await assert.rejects(
        () => runSilently(["add", "billing"]),
        /requires the database module/,
      );

      await runSilently(["add", "database"]);

      await assert.rejects(
        () => runSilently(["add", "billing"]),
        /requires the auth module/,
      );
    });
  });
});

test("api keys installer requires database and auth modules", async () => {
  await withWorkspace(async (workspace) => {
    await runSilently(["create", "api-keys-app"]);
    const appDir = resolve(workspace, "api-keys-app");

    await withCwd(appDir, async () => {
      await assert.rejects(
        () => runSilently(["add", "api-keys"]),
        /requires the database module/,
      );

      await runSilently(["add", "database"]);

      await assert.rejects(
        () => runSilently(["add", "api-keys"]),
        /requires the auth module/,
      );
    });
  });
});

test("doctor reports missing project files", async () => {
  await withWorkspace(async () => {
    await assert.rejects(() => runSilently(["doctor"]), /8 check\(s\) failed/);
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
