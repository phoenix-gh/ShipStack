import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");

const checks = [
  {
    label: "Worktree is clean",
    action: async () => {
      const result = await run("git", ["status", "--short"]);
      return {
        ok: result.stdout.trim() === "",
        detail: result.stdout.trim() || "clean",
      };
    },
  },
  {
    label: "Release verification script exists",
    action: async () => {
      const packageJson = JSON.parse(
        await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
      );
      const script = packageJson.scripts?.["verify:release"];

      return {
        ok: typeof script === "string" && script.includes("pnpm smoke"),
        detail: script ?? "missing",
      };
    },
  },
  {
    label: "Generated deploy verifier exists",
    action: async () => {
      const file = "templates/base/scripts/verify-deployed.mjs";
      return {
        ok: await exists(resolve(repositoryRoot, file)),
        detail: file,
      };
    },
  },
  {
    label: "npm release workflow shape is valid",
    action: async () => {
      const file = ".github/workflows/release-npm.yml";
      const workflowPath = resolve(repositoryRoot, file);
      const content = await readFile(workflowPath, "utf8");
      const requiredMarkers = [
        "workflow_dispatch:",
        "pnpm verify:release",
        "NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}",
        "pnpm pack --pack-destination",
        "npm publish",
        "--provenance",
      ];
      const missingMarkers = requiredMarkers.filter(
        (marker) => !content.includes(marker),
      );
      const expectedOrder = [
        "packages/core",
        "packages/cli",
        "packages/create-shipstack",
      ];
      const packageOrder = expectedOrder.map((packagePath) =>
        content.indexOf(packagePath),
      );
      const orderIsValid =
        packageOrder.every((index) => index >= 0) &&
        packageOrder.every((index, position) => {
          return position === 0 || index > packageOrder[position - 1];
        });

      return {
        ok: missingMarkers.length === 0 && orderIsValid,
        detail:
          missingMarkers.length > 0
            ? `missing markers: ${missingMarkers.join(", ")}`
            : orderIsValid
              ? file
              : `package publish order must be ${expectedOrder.join(" -> ")}`,
      };
    },
  },
  {
    label: "Git remote is configured",
    action: async () => {
      const result = await run("git", ["remote", "-v"]);
      return {
        ok: result.stdout.trim() !== "",
        detail: result.stdout.trim() || "no remote configured",
        external: true,
      };
    },
  },
  {
    label: "Wrangler is authenticated",
    action: async () => {
      const result = await run("pnpm", ["dlx", "wrangler", "whoami"]);
      const output = `${result.stdout}${result.stderr}`.trim();
      const unauthenticated = /not authenticated|wrangler login/i.test(output);

      return {
        ok: result.code === 0 && !unauthenticated,
        detail: output || `wrangler whoami exited ${result.code}`,
        external: true,
      };
    },
  },
];

let failed = 0;
let externalBlocked = 0;

for (const check of checks) {
  try {
    const result = await check.action();
    const prefix = result.ok ? "ok" : result.external ? "external" : "fail";

    console.log(`${prefix} ${check.label}`);
    if (!result.ok && result.detail) {
      console.log(`  ${result.detail}`);
    }

    if (!result.ok) {
      if (result.external) {
        externalBlocked += 1;
      } else {
        failed += 1;
      }
    }
  } catch (error) {
    failed += 1;
    console.log(`fail ${check.label}`);
    console.log(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed > 0 || externalBlocked > 0) {
  console.log("");
  console.log(
    `Release audit incomplete: ${failed} local failure(s), ${externalBlocked} external blocker(s).`,
  );
  process.exitCode = 1;
} else {
  console.log("");
  console.log("Release audit passed.");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
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
      resolvePromise({ code, stdout, stderr });
    });
  });
}
