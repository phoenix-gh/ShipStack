import { existsSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../..");
const baseTemplateDir = resolve(repositoryRoot, "templates/base");

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
    console.log(`Module installation is not implemented yet: ${moduleName}`);
    console.log("Available soon: database, auth, api, billing-stripe, storage-r2.");
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

This is an early CLI skeleton. Module installation will land after the base starter is stable.`);
}

