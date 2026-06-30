import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const packageNames = [
  "@shipstack-dev/core",
  "@shipstack-dev/cli",
  "create-shipstack-app",
];

export function parseDistTagArgs(args) {
  const options = {
    dryRun: false,
    tag: "latest",
    version: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--tag") {
      options.tag = readValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--version") {
      options.version = readValue(args, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.version) {
    throw new Error("Missing required option: --version <version>");
  }

  return options;
}

export function buildDistTagCommands({ version, tag }) {
  return packageNames.map((packageName) => ({
    command: "npm",
    args: ["dist-tag", "add", `${packageName}@${version}`, tag],
  }));
}

async function main() {
  const options = parseDistTagArgs(process.argv.slice(2));
  const commands = buildDistTagCommands(options);

  for (const { command, args } of commands) {
    const displayCommand = [command, ...args].join(" ");

    if (options.dryRun) {
      console.log(`[dry-run] ${displayCommand}`);
      continue;
    }

    console.log(displayCommand);
    await run(command, args);
  }
}

function readValue(args, index, optionName) {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command}`));
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
