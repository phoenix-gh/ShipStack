import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const packageJsonFiles = [
  "package.json",
  "packages/core/package.json",
  "packages/cli/package.json",
  "packages/create-shipstack/package.json",
];
const publishablePackages = [
  {
    directory: "packages/core",
    name: "@shipstack/core",
  },
  {
    directory: "packages/cli",
    name: "@shipstack/cli",
  },
  {
    directory: "packages/create-shipstack",
    name: "create-shipstack",
  },
];
const secretPatterns = [
  {
    label: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PRIVATE )?PRIVATE KEY-----/,
  },
  {
    label: "GitHub token",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/,
  },
  {
    label: "npm token",
    pattern: /\bnpm_[A-Za-z0-9]{36,}\b/,
  },
  {
    label: "Stripe secret key",
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/,
  },
  {
    label: "Slack token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    label: "Cloudflare API token",
    pattern: /\b[A-Za-z0-9_-]{40,}\b/,
    context: /cloudflare|wrangler|cf_api|api_token/i,
  },
];

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
    label: "Repository CI workflow shape is valid",
    action: async () => {
      return await assertFileContainsMarkers(".github/workflows/ci.yml", [
        "push:",
        "pull_request:",
        "version: 10.33.0",
        "node-version: 22",
        "pnpm install --frozen-lockfile",
        "pnpm exec playwright install --with-deps chromium",
        "pnpm verify:release",
      ]);
    },
  },
  {
    label: "Package versions are aligned for v0.1.0",
    action: async () => {
      const packageVersions = await Promise.all(
        packageJsonFiles.map(async (file) => {
          const packageJson = JSON.parse(
            await readFile(resolve(repositoryRoot, file), "utf8"),
          );

          return [file, packageJson.version];
        }),
      );
      const versions = new Set(packageVersions.map(([, version]) => version));
      const version = packageVersions[0]?.[1];
      const releaseNotes = await readFile(
        resolve(repositoryRoot, "docs/releases/v0.1.0.md"),
        "utf8",
      );
      const releaseNotesMatch = releaseNotes.includes("# ShipStack v0.1.0");
      const expectedVersion = "0.1.0-alpha.0";

      return {
        ok:
          versions.size === 1 &&
          version === expectedVersion &&
          releaseNotesMatch,
        detail:
          versions.size === 1 && releaseNotesMatch
            ? `${version} packages, v0.1.0 release notes`
            : packageVersions
                .map(([file, packageVersion]) => `${file}: ${packageVersion}`)
                .join("\n  "),
      };
    },
  },
  {
    label: "Publishable package metadata is complete",
    action: async () => {
      const findings = await auditPublishablePackageMetadata();

      return {
        ok: findings.length === 0,
        detail:
          findings.length === 0
            ? "package metadata and README files are present"
            : findings.join("\n  "),
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
    label: "Generated app CI workflow shape is valid",
    action: async () => {
      return await assertFileContainsMarkers(
        "templates/base/.github/workflows/ci.yml",
        [
          "push:",
          "pull_request:",
          "version: 10.33.0",
          "node-version: 22",
          "pnpm install --frozen-lockfile",
          "pnpm verify",
        ],
      );
    },
  },
  {
    label: "Generated app deploy workflow shape is valid",
    action: async () => {
      return await assertFileContainsMarkers(
        "templates/base/.github/workflows/deploy.yml",
        [
          "workflow_dispatch:",
          "environment: production",
          "version: 10.33.0",
          "node-version: 22",
          "pnpm install --frozen-lockfile",
          "pnpm verify",
          "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}",
          "pnpm deploy",
        ],
      );
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
    label: "release notes describe remaining gates",
    action: async () => {
      const file = "docs/releases/v0.1.0.md";
      const content = await readFile(resolve(repositoryRoot, file), "utf8");
      const requiredMarkers = [
        "pnpm release:audit",
        "real Cloudflare deploy",
        "remote CI",
        "npm publish workflow dry-run",
      ];
      const missingMarkers = requiredMarkers.filter(
        (marker) => !content.includes(marker),
      );

      return {
        ok: missingMarkers.length === 0,
        detail:
          missingMarkers.length > 0
            ? `missing markers: ${missingMarkers.join(", ")}`
            : file,
      };
    },
  },
  {
    label: "tracked files do not contain obvious secrets",
    action: async () => {
      const findings = await scanTrackedFilesForSecrets();

      return {
        ok: findings.length === 0,
        detail:
          findings.length === 0
            ? "no obvious tracked secrets"
            : findings.slice(0, 10).join("\n  "),
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

async function assertFileContainsMarkers(file, requiredMarkers) {
  const content = await readFile(resolve(repositoryRoot, file), "utf8");
  const missingMarkers = requiredMarkers.filter(
    (marker) => !content.includes(marker),
  );

  return {
    ok: missingMarkers.length === 0,
    detail:
      missingMarkers.length > 0
        ? `missing markers: ${missingMarkers.join(", ")}`
        : file,
  };
}

async function auditPublishablePackageMetadata() {
  const findings = [];

  for (const packageInfo of publishablePackages) {
    const packageJsonPath = resolve(
      repositoryRoot,
      packageInfo.directory,
      "package.json",
    );
    const readmePath = resolve(
      repositoryRoot,
      packageInfo.directory,
      "README.md",
    );
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    const readme = (await exists(readmePath))
      ? await readFile(readmePath, "utf8")
      : "";

    if (packageJson.name !== packageInfo.name) {
      findings.push(`${packageInfo.directory}: unexpected package name`);
    }

    if (
      typeof packageJson.description !== "string" ||
      packageJson.description.trim().length < 20
    ) {
      findings.push(`${packageInfo.directory}: missing package description`);
    }

    if (packageJson.license !== "MIT") {
      findings.push(`${packageInfo.directory}: license must be MIT`);
    }

    if (packageJson.private !== false) {
      findings.push(`${packageInfo.directory}: package must be publishable`);
    }

    if (!readme.includes(`# ${packageInfo.name}`)) {
      findings.push(`${packageInfo.directory}: README title is missing`);
    }

    if (!readme.includes("0.1.0-alpha.0")) {
      findings.push(`${packageInfo.directory}: README version is missing`);
    }
  }

  return findings;
}

async function scanTrackedFilesForSecrets() {
  const result = await run("git", ["ls-files"]);
  const files = result.stdout
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !isGeneratedOrLockFile(file));
  const findings = [];

  for (const file of files) {
    const content = await readTextFileIfPossible(file);
    if (content === null) {
      continue;
    }

    for (const secretPattern of secretPatterns) {
      if (
        secretPattern.pattern.test(content) &&
        (!secretPattern.context || secretPattern.context.test(content))
      ) {
        findings.push(`${file}: ${secretPattern.label}`);
      }
    }
  }

  return findings;
}

function isGeneratedOrLockFile(file) {
  return (
    file === "pnpm-lock.yaml" ||
    file.endsWith("routeTree.gen.ts") ||
    file.includes("/routeTree.gen.ts")
  );
}

async function readTextFileIfPossible(file) {
  try {
    const content = await readFile(resolve(repositoryRoot, file), "utf8");
    return content.includes("\0") ? null : content;
  } catch {
    return null;
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
