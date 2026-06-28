import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputDir = await mkdtemp(resolve(tmpdir(), "shipstack-pack-"));

try {
  const cliTarball = await pack("packages/cli");
  const createTarball = await pack("packages/create-shipstack");
  const coreTarball = await pack("packages/core");

  await assertTarIncludes(cliTarball, [
    "package/README.md",
    "package/dist/cli.js",
    "package/dist/index.d.ts",
    "package/templates/base/_gitignore",
    "package/templates/base/docs/zh-CN/deployment.md",
    "package/templates/base/docs/zh-CN/env.md",
    "package/templates/base/package.json",
    "package/templates/modules/auth-better-auth/docs/zh-CN/auth.md",
    "package/templates/modules/auth-better-auth/src/features/auth/route-guards.ts",
    "package/templates/modules/api-keys/docs/zh-CN/api-keys.md",
    "package/templates/modules/api-keys/src/features/api-keys/server.ts",
    "package/templates/modules/api-keys/src/routes/api.v1.api-keys.ts",
    "package/templates/modules/api-rate-limit/docs/zh-CN/api-rate-limit.md",
    "package/templates/modules/api-rate-limit/src/features/api/rate-limit.ts",
    "package/templates/modules/billing-stripe/docs/zh-CN/billing.md",
    "package/templates/modules/billing-stripe/src/features/billing/server.ts",
    "package/templates/modules/billing-stripe/src/routes/api.stripe.webhook.ts",
    "package/templates/modules/database-d1/docs/zh-CN/database.md",
    "package/templates/modules/database-d1/drizzle.config.ts",
    "package/templates/modules/openapi/docs/zh-CN/openapi.md",
    "package/templates/modules/openapi/scripts/generate-openapi.mjs",
    "package/templates/modules/openapi/src/routes/api.openapi.ts",
    "package/templates/modules/storage-r2/docs/zh-CN/storage.md",
    "package/templates/modules/storage-r2/src/features/storage/server.ts",
    "package/templates/modules/storage-r2/src/routes/api.v1.files.ts",
  ]);
  await assertTarIncludes(createTarball, [
    "package/README.md",
    "package/dist/cli.js",
    "package/package.json",
  ]);
  await assertTarIncludes(coreTarball, [
    "package/README.md",
    "package/dist/index.js",
    "package/dist/index.d.ts",
    "package/package.json",
  ]);

  await verifyPackedCli({ cliTarball, coreTarball, createTarball });
  await assertMissing(resolve(repositoryRoot, "packages/cli/templates"));
  console.log("Pack check passed.");
} finally {
  await rm(outputDir, {
    force: true,
    recursive: true,
  });
}

async function pack(packagePath) {
  const output = await run("pnpm", ["pack", "--pack-destination", outputDir], {
    cwd: resolve(repositoryRoot, packagePath),
  });
  const match = output.match(/Tarball Details\s*\n(.+\.tgz)/);

  if (!match) {
    throw new Error(`Failed to find tarball path in pack output:\n${output}`);
  }

  return match[1].trim();
}

async function assertTarIncludes(tarball, expectedFiles) {
  const output = await run("tar", ["-tf", tarball]);
  const files = new Set(output.trim().split("\n"));

  for (const expectedFile of expectedFiles) {
    if (!files.has(expectedFile)) {
      throw new Error(`Expected ${tarball} to include ${expectedFile}`);
    }
  }
}

async function assertMissing(path) {
  try {
    await access(path);
  } catch {
    return;
  }

  throw new Error(`Expected generated path to be cleaned up: ${path}`);
}

async function verifyPackedCli({ cliTarball, coreTarball, createTarball }) {
  const workspace = await mkdtemp(resolve(tmpdir(), "shipstack-packed-cli-"));

  try {
    await writeFile(
      resolve(workspace, "package.json"),
      `${JSON.stringify(
        {
          private: true,
          dependencies: {
            "@shipstack/cli": `file:${cliTarball}`,
            "@shipstack/core": `file:${coreTarball}`,
            "create-shipstack-app": `file:${createTarball}`,
          },
          pnpm: {
            overrides: {
              "@shipstack/cli": `file:${cliTarball}`,
              "@shipstack/core": `file:${coreTarball}`,
            },
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await run("pnpm", ["install", "--ignore-scripts"], { cwd: workspace });

    await run(
      "node",
      [
        resolve(workspace, "node_modules/create-shipstack-app/dist/cli.js"),
        "packed-app",
      ],
      {
        cwd: workspace,
      },
    );

    const appDir = resolve(workspace, "packed-app");
    await assertExists(resolve(appDir, "package.json"));
    await assertExists(resolve(appDir, ".gitignore"));
    await assertExists(resolve(appDir, "docs/zh-CN/deployment.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/env.md"));
    await assertExists(resolve(appDir, "scripts/verify-deployed.mjs"));
    await assertExists(resolve(appDir, "src/routes/api.health.ts"));
    await assertExists(resolve(appDir, "AGENTS.md"));

    const shipstackBin = resolve(
      workspace,
      "node_modules/@shipstack/cli/dist/cli.js",
    );
    await run("node", [shipstackBin, "add", "database"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "auth"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "storage"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "billing"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "api-keys"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "openapi"], { cwd: appDir });
    await run("node", [shipstackBin, "add", "api-rate-limit"], {
      cwd: appDir,
    });
    await run("node", [shipstackBin, "doctor"], { cwd: appDir });

    await assertExists(resolve(appDir, "docs/zh-CN/database.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/auth.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/billing.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/storage.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/api-keys.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/openapi.md"));
    await assertExists(resolve(appDir, "docs/zh-CN/api-rate-limit.md"));
    await assertFileContains(resolve(appDir, "README.md"), [
      "[Database](./docs/database.md)",
      "[Authentication](./docs/auth.md)",
      "[Storage](./docs/storage.md)",
      "[Billing](./docs/billing.md)",
      "[API Keys](./docs/api-keys.md)",
      "[OpenAPI](./docs/openapi.md)",
      "[API Rate Limit](./docs/api-rate-limit.md)",
      "[数据库](./docs/zh-CN/database.md)",
      "[认证](./docs/zh-CN/auth.md)",
      "[存储](./docs/zh-CN/storage.md)",
      "[支付](./docs/zh-CN/billing.md)",
      "[API Keys](./docs/zh-CN/api-keys.md)",
      "[OpenAPI](./docs/zh-CN/openapi.md)",
      "[API Rate Limit](./docs/zh-CN/api-rate-limit.md)",
    ]);
    await assertExists(resolve(appDir, "src/db/schema.ts"));
    await assertExists(resolve(appDir, "src/db/billing-schema.ts"));
    await assertExists(resolve(appDir, "src/db/storage-schema.ts"));
    await assertExists(resolve(appDir, "src/db/api-keys-schema.ts"));
    await assertExists(resolve(appDir, "src/features/auth/route-guards.ts"));
    await assertExists(resolve(appDir, "src/features/billing/server.ts"));
    await assertExists(resolve(appDir, "src/features/storage/server.ts"));
    await assertExists(resolve(appDir, "src/features/api-keys/server.ts"));
    await assertExists(resolve(appDir, "src/features/api/rate-limit.ts"));
    await assertExists(resolve(appDir, "src/features/openapi/generated.ts"));
    await assertExists(resolve(appDir, "src/routes/sign-in.tsx"));
    await assertExists(resolve(appDir, "src/routes/api.stripe.webhook.ts"));
    await assertExists(resolve(appDir, "src/routes/api.v1.files.ts"));
    await assertExists(resolve(appDir, "src/routes/api.v1.api-keys.ts"));
    await assertExists(resolve(appDir, "src/routes/api.openapi.ts"));
    await assertExists(resolve(appDir, "scripts/generate-openapi.mjs"));
  } finally {
    await rm(workspace, {
      force: true,
      recursive: true,
    });
  }
}

async function assertExists(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Expected path to exist: ${path}`);
  }
}

async function assertFileContains(path, markers) {
  const content = await readFile(path, "utf8");
  const missingMarkers = markers.filter((marker) => !content.includes(marker));

  if (missingMarkers.length > 0) {
    throw new Error(
      `Expected ${path} to include markers: ${missingMarkers.join(", ")}`,
    );
  }
}

async function run(command, args, options = {}) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repositoryRoot,
      env: process.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise(output);
        return;
      }

      reject(
        new Error(
          `Command failed with exit code ${code}: ${command} ${args.join(" ")}\n${output}`,
        ),
      );
    });
  });
}
