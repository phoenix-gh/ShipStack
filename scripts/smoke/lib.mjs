import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
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
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500,
      });
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

export async function runAndCapture(command, args, options = {}) {
  const cwd = options.cwd ?? repositoryRoot;
  const label = [command, ...args].join(" ");
  console.log(`\n$ ${label}`);

  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolvePromise({
        code,
        stdout,
        stderr,
        output: `${stdout}${stderr}`,
      });
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
  if (options.install !== false) {
    await run("pnpm", ["install"], { cwd: appDir });
  }

  if (options.test !== false) {
    await run("pnpm", ["test"], { cwd: appDir });
  }

  if (options.lint !== false) {
    await run("pnpm", ["lint"], { cwd: appDir });
  }

  if (options.typecheck !== false) {
    await run("pnpm", ["typecheck"], { cwd: appDir });
  }

  if (options.build !== false) {
    await run("pnpm", ["build"], { cwd: appDir });
  }
}

export async function verifyRuntimeRoutes(appDir, checks) {
  await withDevServer(appDir, async (origin) => {
    for (const check of checks) {
      await verifyHttpCheck(`${origin}${check.path}`, check);
    }
  });
}

export async function withDevServer(appDir, callback, options = {}) {
  const port = await getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;

  if (options.beforeStart) {
    await options.beforeStart({ origin, port });
  }

  const server = await startDevServer(appDir, port);

  try {
    await callback(origin);
  } finally {
    await server.stop();
  }
}

async function startDevServer(appDir, port) {
  const args = ["dev", "--host", "127.0.0.1", "--port", String(port)];
  const label = ["pnpm", ...args].join(" ");
  const logs = [];

  console.log(`\n$ ${label}`);

  const child = spawn("pnpm", args, {
    cwd: appDir,
    detached: process.platform !== "win32",
    env: process.env,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => collectLog(logs, chunk));
  child.stderr.on("data", (chunk) => collectLog(logs, chunk));

  let exited = false;
  child.on("exit", () => {
    exited = true;
  });

  try {
    await waitForHttp(`http://127.0.0.1:${port}/`, () => exited, logs);
  } catch (error) {
    await stopChild(child);
    throw error;
  }

  return {
    async stop() {
      await stopChild(child);
    },
  };
}

async function verifyHttpCheck(url, check) {
  const response = await fetch(url, {
    redirect: check.redirect ?? "follow",
  });

  if (response.status !== check.status) {
    throw new Error(
      `Expected ${url} to return ${check.status}, received ${response.status}`,
    );
  }

  const body = await response.text();
  if (check.includes && !body.includes(check.includes)) {
    throw new Error(`Expected ${url} response to include: ${check.includes}`);
  }

  if (check.json) {
    const data = JSON.parse(body);
    check.json(data);
  }
}

async function waitForHttp(url, hasExited, logs) {
  const startedAt = Date.now();
  const timeoutMs = 90_000;
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    if (hasExited()) {
      throw new Error(
        `Dev server exited before becoming ready.\n${logs.join("")}`,
      );
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Timed out waiting for dev server: ${message}\n${logs.join("")}`,
  );
}

async function getAvailablePort() {
  const server = createServer();

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });

  const address = server.address();
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });

  if (!address || typeof address === "string") {
    throw new Error("Failed to allocate a local port");
  }

  return address.port;
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  killChild(child, "SIGTERM");

  await Promise.race([
    new Promise((resolvePromise) => child.once("exit", resolvePromise)),
    delay(5_000).then(() => {
      if (child.exitCode === null && child.signalCode === null) {
        killChild(child, "SIGKILL");
      }
    }),
  ]);
}

function killChild(child, signal) {
  if (process.platform === "win32") {
    child.kill(signal);
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

function collectLog(logs, chunk) {
  logs.push(chunk.toString());

  if (logs.length > 80) {
    logs.splice(0, logs.length - 80);
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
