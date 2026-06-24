import { existsSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../..");
const packagedTemplatesDir = resolve(packageRoot, "templates");
const repositoryTemplatesDir = resolve(repositoryRoot, "templates");
const templatesDir = existsSync(packagedTemplatesDir)
  ? packagedTemplatesDir
  : repositoryTemplatesDir;
const baseTemplateDir = resolve(templatesDir, "base");
const modulesTemplateDir = resolve(templatesDir, "modules");

export async function runCli(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
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

    if (moduleName === "auth" || moduleName === "auth-better-auth") {
      await addAuthBetterAuth();
      return;
    }

    if (moduleName === "api") {
      console.log(
        "The API foundation is already included in the base starter.",
      );
      console.log(
        "Available now: /api/health, /api/v1/me, JSON envelopes, request IDs, and trusted-origin CORS.",
      );
      console.log("Future API modules: api-keys, api-openapi, api-rate-limit.");
      return;
    }

    console.log(`Module installation is not implemented yet: ${moduleName}`);
    console.log("Available now: database, auth.");
    console.log("Available later: billing-stripe, storage-r2, api-keys.");
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
    filter: (source) => isCopyableTemplatePath(baseTemplateDir, source),
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
  const cwd = process.cwd();
  const checks: Array<[string, boolean]> = [
    ["package.json", existsSync(resolve(cwd, "package.json"))],
    ["wrangler.jsonc", existsSync(resolve(cwd, "wrangler.jsonc"))],
    ["src/routes", existsSync(resolve(cwd, "src/routes"))],
    [".env.example", existsSync(resolve(cwd, ".env.example"))],
  ];

  if (await hasDatabaseModule(cwd)) {
    checks.push(
      [
        "database drizzle.config.ts",
        existsSync(resolve(cwd, "drizzle.config.ts")),
      ],
      [
        "database src/db/schema.ts",
        existsSync(resolve(cwd, "src/db/schema.ts")),
      ],
      [
        "database src/db/client.ts",
        existsSync(resolve(cwd, "src/db/client.ts")),
      ],
      [
        "database .env.example D1 vars",
        await fileIncludes(
          resolve(cwd, ".env.example"),
          "CLOUDFLARE_DATABASE_ID",
        ),
      ],
      ["database wrangler DB binding", await hasWranglerBinding(cwd, "DB")],
      [
        "database AGENTS.md guidance",
        await fileIncludes(resolve(cwd, "AGENTS.md"), "## Database Module"),
      ],
    );
  }

  if (await hasAuthModule(cwd)) {
    checks.push(
      [
        "auth src/db/auth-schema.ts",
        existsSync(resolve(cwd, "src/db/auth-schema.ts")),
      ],
      [
        "auth src/features/auth/server.ts",
        existsSync(resolve(cwd, "src/features/auth/server.ts")),
      ],
      [
        "auth src/features/auth/session.ts",
        existsSync(resolve(cwd, "src/features/auth/session.ts")),
      ],
      ["auth api route", existsSync(resolve(cwd, "src/routes/api.auth.$.ts"))],
      [
        "auth sign-in route",
        existsSync(resolve(cwd, "src/routes/sign-in.tsx")),
      ],
      [
        "auth sign-up route",
        existsSync(resolve(cwd, "src/routes/sign-up.tsx")),
      ],
      [
        "auth .dev.vars.example secret",
        await fileIncludes(
          resolve(cwd, ".dev.vars.example"),
          "BETTER_AUTH_SECRET",
        ),
      ],
      [
        "auth drizzle schema config",
        await fileIncludes(
          resolve(cwd, "drizzle.config.ts"),
          "./src/db/auth-schema.ts",
        ),
      ],
      [
        "auth AGENTS.md guidance",
        await fileIncludes(resolve(cwd, "AGENTS.md"), "## Auth Module"),
      ],
    );
  }

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

async function hasDatabaseModule(cwd: string) {
  return (
    existsSync(resolve(cwd, "src/db/client.ts")) ||
    (await packageJsonHasDependency(cwd, "drizzle-orm"))
  );
}

async function hasAuthModule(cwd: string) {
  return (
    existsSync(resolve(cwd, "src/features/auth/server.ts")) ||
    (await packageJsonHasDependency(cwd, "better-auth"))
  );
}

async function packageJsonHasDependency(cwd: string, dependency: string) {
  const packageJsonPath = resolve(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(
    await readFile(packageJsonPath, "utf8"),
  ) as Record<string, unknown>;
  return (
    objectHasKey(packageJson.dependencies, dependency) ||
    objectHasKey(packageJson.devDependencies, dependency)
  );
}

async function hasWranglerBinding(cwd: string, bindingName: string) {
  const wranglerPath = resolve(cwd, "wrangler.jsonc");
  if (!existsSync(wranglerPath)) {
    return false;
  }

  const config = parseJsonc(await readFile(wranglerPath, "utf8"));
  const d1Databases = Array.isArray(config.d1_databases)
    ? config.d1_databases
    : [];
  return d1Databases.some((binding) => {
    return isRecord(binding) && binding.binding === bindingName;
  });
}

async function fileIncludes(file: string, marker: string) {
  if (!existsSync(file)) {
    return false;
  }

  return (await readFile(file, "utf8")).includes(marker);
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
  await appendIfMissing(
    resolve(cwd, "AGENTS.md"),
    `
## Database Module

- Drizzle schema files under \`src/db\` are the source of truth.
- Use \`src/db/client.ts\` for D1-backed database access.
- Commit generated migrations under \`drizzle/migrations\`.
- Keep local and remote migration commands distinct.
- Do not add real Cloudflare credentials or database IDs to committed files.
`,
    "## Database Module",
  );

  console.log("Installed database-d1 module.");
  console.log("");
  console.log("Next steps:");
  console.log("  pnpm install");
  console.log("  pnpm db:cf:create");
  console.log("  pnpm db:generate");
  console.log("  pnpm db:cf:migrate:local");
}

async function addAuthBetterAuth() {
  const cwd = process.cwd();
  assertProjectFile("package.json");
  assertProjectFile("wrangler.jsonc");

  if (!existsSync(resolve(cwd, "src/db/client.ts"))) {
    throw new Error(
      "The auth module requires the database module. Run `shipstack add database` first.",
    );
  }

  await copyModuleFiles("auth-better-auth", cwd);
  await copyModuleOverrides("auth-better-auth", cwd);
  await updatePackageJson(resolve(cwd, "package.json"), {
    dependencies: {
      "@better-auth/drizzle-adapter": "^1.6.20",
      "better-auth": "^1.6.20",
    },
  });
  await appendIfMissing(
    resolve(cwd, ".dev.vars.example"),
    `
# Better Auth local Worker secrets.
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:5173"

# Optional Google OAuth local Worker secrets.
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
`,
    "BETTER_AUTH_SECRET",
  );
  await includeAuthSchemaInDrizzleConfig(resolve(cwd, "drizzle.config.ts"));
  await appendIfMissing(
    resolve(cwd, "AGENTS.md"),
    `
## Auth Module

- Use \`src/features/auth/route-guards.ts\` for protected page routes.
- Use \`src/features/auth/session.ts\` for server-side session access.
- Do not trust client-side auth state for protected server behavior.
- Derive API user identity from Better Auth session data or a future API key module, never from a client-provided user ID.
- Keep OAuth providers optional unless the app explicitly requires them.
`,
    "## Auth Module",
  );

  console.log("Installed auth-better-auth module.");
  console.log("");
  console.log("Next steps:");
  console.log("  pnpm install");
  console.log("  cp .dev.vars.example .dev.vars");
  console.log("  set BETTER_AUTH_SECRET in .dev.vars");
}

async function includeAuthSchemaInDrizzleConfig(file: string) {
  if (!existsSync(file)) {
    return;
  }

  const content = await readFile(file, "utf8");
  if (content.includes("./src/db/auth-schema.ts")) {
    return;
  }

  const nextContent = content.replace(
    'schema: "./src/db/schema.ts",',
    'schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],',
  );

  await writeFile(file, nextContent);
}

function assertProjectFile(fileName: string) {
  if (!existsSync(resolve(process.cwd(), fileName))) {
    throw new Error(
      `Expected ${fileName} in the current directory. Run this command from a ShipStack app.`,
    );
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
    filter: (source) =>
      isCopyableTemplatePath(sourceDir, source, {
        excludedSegments: ["_overrides"],
      }),
  });
}

function isCopyableTemplatePath(
  rootDir: string,
  source: string,
  options: { excludedSegments?: string[] } = {},
) {
  const segments = relative(rootDir, source)
    .split(/[\\/]+/)
    .filter(Boolean);
  const excludedSegments = new Set([
    "node_modules",
    ".wrangler",
    ...(options.excludedSegments ?? []),
  ]);

  return !segments.some((segment) => excludedSegments.has(segment));
}

async function copyModuleOverrides(moduleId: string, targetDir: string) {
  const overridesDir = resolve(modulesTemplateDir, moduleId, "_overrides");
  if (!existsSync(overridesDir)) {
    return;
  }

  await cp(overridesDir, targetDir, {
    recursive: true,
    errorOnExist: false,
    force: true,
  });
}

interface PackageJsonChanges {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function updatePackageJson(file: string, changes: PackageJsonChanges) {
  const packageJson = JSON.parse(await readFile(file, "utf8")) as Record<
    string,
    unknown
  >;

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
  const d1Databases = Array.isArray(config.d1_databases)
    ? config.d1_databases
    : [];

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
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectHasKey(value: unknown, key: string) {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}

async function appendIfMissing(file: string, content: string, marker: string) {
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  if (existing.includes(marker)) {
    return;
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${existing.trimEnd()}\n${content.trimEnd()}\n`);
}

async function replaceInFile(
  file: string,
  replacements: Record<string, string>,
) {
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
  auth        Add Better Auth

This is an early CLI skeleton. More modules will land as the starter matures.`);
}
