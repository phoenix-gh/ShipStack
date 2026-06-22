import { existsSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../..");
const baseTemplateDir = resolve(repositoryRoot, "templates/base");
const modulesTemplateDir = resolve(repositoryRoot, "templates/modules");

export async function runCli(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "doctor") {
    await doctor();
    return;
  }

  if (command === "create") {
    await create(args[0]);
    return;
  }

  if (command === "add") {
    const moduleName = args[0];
    if (!moduleName) {
      throw new Error("Usage: shipstack add <module>");
    }

    if (moduleName === "database" || moduleName === "database-d1") {
      await addDatabaseD1();
      return;
    }

    console.log(`Module installation is not implemented yet: ${moduleName}`);
    console.log("Available now: database.");
    console.log("Available soon: auth, api, billing-stripe, storage-r2.");
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

async function create(projectName: string | undefined) {
  if (!projectName) {
    throw new Error("Usage: shipstack create <project-name>");
  }

  const targetDir = resolve(process.cwd(), projectName);

  if (existsSync(targetDir)) {
    throw new Error(`Target directory already exists: ${targetDir}`);
  }

  await cp(baseTemplateDir, targetDir, {
    recursive: true,
    filter: (source) => !source.includes("node_modules") && !source.includes(".wrangler"),
  });

  await replaceInFile(resolve(targetDir, "package.json"), {
    "{{projectName}}": projectName,
  });
  await replaceInFile(resolve(targetDir, "wrangler.jsonc"), {
    "{{projectName}}": projectName,
  });

  console.log(`Created ${projectName}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${projectName}`);
  console.log("  pnpm install");
  console.log("  pnpm dev");
}

async function doctor() {
  const checks = [
    ["package.json", existsSync(resolve(process.cwd(), "package.json"))],
    ["wrangler.jsonc", existsSync(resolve(process.cwd(), "wrangler.jsonc"))],
    ["src/routes", existsSync(resolve(process.cwd(), "src/routes"))],
    [".env.example", existsSync(resolve(process.cwd(), ".env.example"))],
  ] as const;

  let failed = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "ok" : "missing"} ${label}`);
    if (!ok) {
      failed += 1;
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} check(s) failed`);
  }
}

async function addDatabaseD1() {
  const cwd = process.cwd();
  assertProjectFile("package.json");
  assertProjectFile("wrangler.jsonc");

  await copyModuleFiles("database-d1", cwd);
  await updatePackageJson(resolve(cwd, "package.json"), {
    dependencies: {
      "drizzle-orm": "^0.45.2",
    },
    devDependencies: {
      "@cloudflare/workers-types": "^4.20260621.1",
      "drizzle-kit": "^0.31.10",
      dotenv: "^17.4.2",
    },
    scripts: {
      "db:generate": "drizzle-kit generate",
      "db:push": "drizzle-kit push",
      "db:migrate": "drizzle-kit migrate",
      "db:studio": "drizzle-kit studio",
      "db:cf:create": "wrangler d1 create shipstack-db",
      "db:cf:migrate:local": "wrangler d1 migrations apply DB --local",
      "db:cf:migrate:remote": "wrangler d1 migrations apply DB --remote",
    },
  });
  await updateWranglerD1(resolve(cwd, "wrangler.jsonc"));
  await appendIfMissing(
    resolve(cwd, ".env.example"),
    `
# Cloudflare D1 tooling variables for Drizzle Kit.
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_DATABASE_ID=""
CLOUDFLARE_D1_TOKEN=""
`,
    "CLOUDFLARE_ACCOUNT_ID",
  );

  console.log("Installed database-d1 module.");
  console.log("");
  console.log("Next steps:");
  console.log("  pnpm install");
  console.log("  pnpm db:cf:create");
  console.log("  pnpm db:generate");
  console.log("  pnpm db:cf:migrate:local");
}

function assertProjectFile(fileName: string) {
  if (!existsSync(resolve(process.cwd(), fileName))) {
    throw new Error(`Expected ${fileName} in the current directory. Run this command from a ShipStack app.`);
  }
}

async function copyModuleFiles(moduleId: string, targetDir: string) {
  const sourceDir = resolve(modulesTemplateDir, moduleId);
  if (!existsSync(sourceDir)) {
    throw new Error(`Unknown module template: ${moduleId}`);
  }

  await cp(sourceDir, targetDir, {
    recursive: true,
    errorOnExist: false,
    force: false,
    filter: (source) => !source.includes("node_modules") && !source.includes(".wrangler"),
  });
}

interface PackageJsonChanges {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function updatePackageJson(file: string, changes: PackageJsonChanges) {
  const packageJson = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;

  mergeObject(packageJson, "dependencies", changes.dependencies);
  mergeObject(packageJson, "devDependencies", changes.devDependencies);
  mergeObject(packageJson, "scripts", changes.scripts);

  await writeFile(file, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function mergeObject(
  target: Record<string, unknown>,
  key: string,
  values: Record<string, string> | undefined,
) {
  if (!values) {
    return;
  }

  const current = isRecord(target[key]) ? target[key] : {};
  target[key] = {
    ...values,
    ...current,
  };
}

async function updateWranglerD1(file: string) {
  const config = parseJsonc(await readFile(file, "utf8"));
  const d1Databases = Array.isArray(config.d1_databases) ? config.d1_databases : [];

  const hasDbBinding = d1Databases.some((binding) => {
    return isRecord(binding) && binding.binding === "DB";
  });

  if (!hasDbBinding) {
    d1Databases.push({
      binding: "DB",
      database_name: "shipstack-db",
      database_id: "replace-with-d1-database-id",
      migrations_dir: "drizzle/migrations",
    });
  }

  config.d1_databases = d1Databases;
  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`);
}

function parseJsonc(content: string) {
  return JSON.parse(stripJsonComments(content)) as Record<string, unknown>;
}

function stripJsonComments(content: string) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function appendIfMissing(file: string, content: string, marker: string) {
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  if (existing.includes(marker)) {
    return;
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${existing.trimEnd()}\n${content.trimEnd()}\n`);
}

async function replaceInFile(file: string, replacements: Record<string, string>) {
  let content = await readFile(file, "utf8");
  for (const [from, to] of Object.entries(replacements)) {
    content = content.split(from).join(to);
  }
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

function printHelp() {
  console.log(`ShipStack CLI

Usage:
  shipstack create <project-name>
  shipstack doctor
  shipstack add <module>

Modules:
  database    Add Cloudflare D1 + Drizzle ORM

This is an early CLI skeleton. More modules will land as the starter matures.`);
}
