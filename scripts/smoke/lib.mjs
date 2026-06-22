import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const createShipStackBin = resolve(
  repositoryRoot,
  "packages/create-shipstack/dist/cli.js",
);
export const shipStackBin = resolve(repositoryRoot, "packages/cli/dist/cli.js");

export async function createWorkspace(label) {
  const directory = await mkdtemp(resolve(tmpdir(), `shipstack-${label}-`));
  let cleaned = false;

  return {
    directory,
    async cleanup() {
      if (cleaned) {
        return;
      }

      cleaned = true;
      await rm(directory, { recursive: true, force: true });
    },
  };
}

export async function run(command, args, options = {}) {
  const cwd = options.cwd ?? repositoryRoot;
  const label = [command, ...args].join(" ");
  console.log(`\n$ ${label}`);

  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${label}`));
    });
  });
}

export async function runSmoke(label, scenario) {
  const workspace = await createWorkspace(label);
  console.log(`Smoke workspace: ${workspace.directory}`);

  try {
    await scenario(workspace.directory);
    await workspace.cleanup();
    console.log(`Smoke passed: ${label}`);
  } catch (error) {
    console.error(`Smoke failed: ${label}`);
    console.error(`Workspace kept for inspection: ${workspace.directory}`);
    throw error;
  }
}

export async function createApp(workspace, projectName) {
  await run("node", [createShipStackBin, projectName], { cwd: workspace });
  return resolve(workspace, projectName);
}

export async function verifyGeneratedApp(appDir, options = {}) {
  await run("pnpm", ["install"], { cwd: appDir });

  if (options.test !== false) {
    await run("pnpm", ["test"], { cwd: appDir });
  }

  await run("pnpm", ["typecheck"], { cwd: appDir });
  await run("pnpm", ["build"], { cwd: appDir });
}
