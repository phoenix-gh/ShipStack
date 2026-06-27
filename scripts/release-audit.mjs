import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const localOnly = process.argv.includes("--local");
const allowDirty = process.argv.includes("--allow-dirty");
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
const restrictedCompetitorNames = /\b(?:TanStarter|MkFast)\b/;
const allowedCompetitorReferenceFiles = new Set([
  "AGENTS.md",
  "CONTRIBUTING.md",
  "docs/LEGAL_BOUNDARIES.md",
  "docs/RELEASE.md",
  "docs/zh-CN/AGENTS.md",
  "docs/zh-CN/LEGAL_BOUNDARIES.md",
  "docs/zh-CN/RELEASE.md",
]);

const checks = [
  {
    label: "Worktree is clean",
    requiresCleanWorktree: true,
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
    label: "Local npm publish dry-run script exists",
    action: async () => {
      const packageJson = JSON.parse(
        await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
      );
      const script = packageJson.scripts?.["publish:dry-run"];

      return {
        ok:
          script === "node scripts/publish-dry-run.mjs" &&
          (await exists(
            resolve(repositoryRoot, "scripts/publish-dry-run.mjs"),
          )),
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
    label: "Quickstart docs describe MVP path",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "docs/QUICKSTART.md",
          markers: [
            "pnpm create shipstack my-app",
            "node packages/create-shipstack/dist/cli.js my-app",
            "shipstack add database",
            "shipstack add api-rate-limit",
            "pnpm db:cf:migrate:local",
            "pnpm deploy:dry-run",
            "Deployment Verification",
          ],
        },
        {
          file: "docs/zh-CN/QUICKSTART.md",
          markers: [
            "pnpm create shipstack my-app",
            "node packages/create-shipstack/dist/cli.js my-app",
            "shipstack add database",
            "shipstack add api-rate-limit",
            "pnpm db:cf:migrate:local",
            "pnpm deploy:dry-run",
            "部署验证",
          ],
        },
        {
          file: "README.md",
          markers: ["[Quickstart](./docs/QUICKSTART.md)"],
        },
        {
          file: "docs/zh-CN/README.md",
          markers: ["[快速开始](./QUICKSTART.md)"],
        },
      ]);
    },
  },
  {
    label: "Generated README describes current modules",
    action: async () => {
      return await assertFileContainsMarkers("templates/base/README.md", [
        "shipstack add database",
        "shipstack add auth",
        "shipstack add billing",
        "shipstack add storage",
        "shipstack add api-keys",
        "shipstack add openapi",
        "shipstack add api-rate-limit",
        "pnpm install",
        "Stripe checkout",
        "R2-backed file APIs",
        "usable by external clients",
      ]);
    },
  },
  {
    label: "Generated env examples are guarded",
    action: async () => {
      const checks = [
        await assertFileContainsMarkers("templates/base/.env.example", [
          "VITE_APP_NAME",
        ]),
        await assertFileContainsMarkers("templates/base/.dev.vars.example", [
          "SHIPSTACK_TRUSTED_ORIGINS",
        ]),
        await assertFileContainsMarkers("templates/base/_gitignore", [
          ".env",
          ".env.*",
          "!.env.example",
          ".dev.vars",
          ".dev.vars.*",
          "!.dev.vars.example",
        ]),
        await assertFileContainsMarkers("templates/base/docs/env.md", [
          "cp .env.example .env.local",
          "cp .dev.vars.example .dev.vars",
          "Never put secrets in `VITE_*` variables.",
        ]),
        await assertFileContainsMarkers("templates/base/docs/zh-CN/env.md", [
          "cp .env.example .env.local",
          "cp .dev.vars.example .dev.vars",
          "不要把 secrets 放进 `VITE_*` 变量。",
        ]),
      ];
      const findings = checks
        .filter((check) => !check.ok)
        .map((check) => check.detail);

      return {
        ok: findings.length === 0,
        detail:
          findings.length === 0
            ? "env examples, ignore rules, and docs are aligned"
            : findings.join("\n  "),
      };
    },
  },
  {
    label: "Generated module Chinese docs are present",
    action: async () => {
      const checks = [
        await assertFileContainsMarkers(
          "templates/modules/database-d1/docs/zh-CN/database.md",
          ["pnpm db:cf:migrate:local", "pnpm db:cf:migrate:remote"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/auth-better-auth/docs/zh-CN/auth.md",
          ["requireRouteSession", "GOOGLE_CLIENT_SECRET"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/billing-stripe/docs/zh-CN/billing.md",
          ["STRIPE_WEBHOOK_SECRET", "checkout.session.completed"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/storage-r2/docs/zh-CN/storage.md",
          ["wrangler r2 bucket create", "Better Auth session"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/api-keys/docs/zh-CN/api-keys.md",
          ["Authorization: Bearer", "D1 中只保存 hash"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/openapi/docs/zh-CN/openapi.md",
          ["pnpm openapi:generate", "/api/openapi"],
        ),
        await assertFileContainsMarkers(
          "templates/modules/api-rate-limit/docs/zh-CN/api-rate-limit.md",
          ["Cloudflare WAF", "checkRateLimit"],
        ),
      ];
      const findings = checks
        .filter((check) => !check.ok)
        .map((check) => check.detail);

      return {
        ok: findings.length === 0,
        detail:
          findings.length === 0
            ? "database, auth, billing, storage, API keys, OpenAPI, and API rate limit module Chinese docs are present"
            : findings.join("\n  "),
      };
    },
  },
  {
    label: "Generated module install docs include dependency install",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "templates/modules/api-keys/docs/api-keys.md",
          markers: [
            "shipstack add api-keys",
            "pnpm install",
            "pnpm db:generate",
          ],
        },
        {
          file: "templates/modules/api-keys/docs/zh-CN/api-keys.md",
          markers: [
            "shipstack add api-keys",
            "pnpm install",
            "pnpm db:generate",
          ],
        },
        {
          file: "templates/modules/openapi/docs/openapi.md",
          markers: [
            "shipstack add openapi",
            "pnpm install",
            "pnpm openapi:generate",
          ],
        },
        {
          file: "templates/modules/openapi/docs/zh-CN/openapi.md",
          markers: [
            "shipstack add openapi",
            "pnpm install",
            "pnpm openapi:generate",
          ],
        },
        {
          file: "templates/modules/api-rate-limit/docs/api-rate-limit.md",
          markers: [
            "shipstack add api-rate-limit",
            "pnpm install",
            "pnpm test",
          ],
        },
        {
          file: "templates/modules/api-rate-limit/docs/zh-CN/api-rate-limit.md",
          markers: [
            "shipstack add api-rate-limit",
            "pnpm install",
            "pnpm test",
          ],
        },
      ]);
    },
  },
  {
    label: "Generated module docs are linked from README",
    action: async () => {
      return await assertFileContainsMarkers("packages/cli/src/run-cli.ts", [
        "[Database](./docs/database.md)",
        "[Authentication](./docs/auth.md)",
        "[Billing](./docs/billing.md)",
        "[Storage](./docs/storage.md)",
        "[API Keys](./docs/api-keys.md)",
        "[OpenAPI](./docs/openapi.md)",
        "[API Rate Limit](./docs/api-rate-limit.md)",
        "[数据库](./docs/zh-CN/database.md)",
        "[认证](./docs/zh-CN/auth.md)",
        "[支付](./docs/zh-CN/billing.md)",
        "[存储](./docs/zh-CN/storage.md)",
        "[API Keys](./docs/zh-CN/api-keys.md)",
        "[OpenAPI](./docs/zh-CN/openapi.md)",
        "[API Rate Limit](./docs/zh-CN/api-rate-limit.md)",
      ]);
    },
  },
  {
    label: "Doctor checks module docs",
    action: async () => {
      return await assertFileContainsMarkers("packages/cli/src/run-cli.ts", [
        "database docs",
        "database README docs links",
        "auth docs",
        "auth README docs links",
        "billing docs",
        "billing README docs links",
        "storage docs",
        "storage README docs links",
        "api keys docs",
        "api keys README docs links",
        "openapi docs",
        "openapi README docs links",
        "api rate limit docs",
        "api rate limit README docs links",
      ]);
    },
  },
  {
    label: "Doctor checks base docs and secret guards",
    action: async () => {
      return await assertFileContainsMarkers("packages/cli/src/run-cli.ts", [
        ".dev.vars.example",
        ".gitignore secret guards",
        "base docs",
        "base README docs links",
      ]);
    },
  },
  {
    label: "External audit checks are bounded",
    action: async () => {
      return await assertFileContainsMarkers("scripts/release-audit.mjs", [
        "--local",
        "--allow-dirty",
        "timeoutMs: 15_000",
        "Command timed out after",
      ]);
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
      return await assertFilesContainMarkers([
        {
          file: "docs/releases/v0.1.0.md",
          markers: [
            "pnpm release:audit",
            "real Cloudflare deploy",
            "remote CI",
            "npm publish workflow dry-run",
          ],
        },
        {
          file: "docs/zh-CN/releases/v0.1.0.md",
          markers: [
            "pnpm release:audit",
            "Cloudflare 部署验证",
            "远端仓库的 GitHub Actions workflow",
            "npm publish workflow dry-run",
          ],
        },
      ]);
    },
  },
  {
    label: "release checklist describes release gates",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "docs/RELEASE.md",
          markers: [
            "pnpm verify:release",
            "pnpm pack:check",
            "pnpm publish:dry-run",
            "pnpm smoke:temporary-deploy",
            "real Cloudflare account deploy",
            "remote GitHub Actions workflow",
            "npm provenance",
          ],
        },
        {
          file: "docs/zh-CN/RELEASE.md",
          markers: [
            "pnpm verify:release",
            "pnpm pack:check",
            "pnpm publish:dry-run",
            "pnpm smoke:temporary-deploy",
            "真实 Cloudflare 账号部署",
            "远端 GitHub Actions workflow",
            "npm provenance",
          ],
        },
      ]);
    },
  },
  {
    label: "README describes current release status",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "README.md",
          markers: [
            "local npm publish dry-run",
            "real Cloudflare deployment pass",
            "remote GitHub Actions confirmation",
            "npm publish workflow dry-run on the remote repository",
          ],
        },
        {
          file: "docs/zh-CN/README.md",
          markers: [
            "本地 npm publish dry-run",
            "真实 Cloudflare 部署验证",
            "远端仓库确认 GitHub Actions 通过",
            "远端仓库运行 npm publish workflow dry-run",
          ],
        },
      ]);
    },
  },
  {
    label: "progress docs describe current release status",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "docs/PROGRESS.md",
          markers: [
            "local `v0.1.0` MVP release candidate",
            "Wrangler is not authenticated",
            "no configured Git remote",
            "pnpm publish:dry-run",
            "Needs approval",
            "Full release audit",
            "External block",
          ],
        },
        {
          file: "docs/zh-CN/PROGRESS.md",
          markers: [
            "本地 `v0.1.0` MVP release candidate",
            "Wrangler 尚未登录",
            "没有配置 Git remote",
            "pnpm publish:dry-run",
            "需要批准",
            "完整 release audit",
            "外部阻塞",
          ],
        },
      ]);
    },
  },
  {
    label: "contributing guide lists release gates",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: "CONTRIBUTING.md",
          markers: [
            "pnpm verify:release",
            "pnpm pack:check",
            "pnpm publish:dry-run",
            "pnpm smoke:temporary-deploy",
            "real Cloudflare account deploy",
            "remote npm publish workflow dry-run",
          ],
        },
        {
          file: "docs/zh-CN/CONTRIBUTING.md",
          markers: [
            "pnpm verify:release",
            "pnpm pack:check",
            "pnpm publish:dry-run",
            "pnpm smoke:temporary-deploy",
            "真实 Cloudflare 账号部署",
            "远端 npm publish workflow dry-run",
          ],
        },
      ]);
    },
  },
  {
    label: "PR template describes bounded verification",
    action: async () => {
      return await assertFileContainsMarkers(
        ".github/PULL_REQUEST_TEMPLATE.md",
        [
          "pnpm verify:local",
          "pnpm smoke` for template, module, CLI, generated app, or package changes",
          "pnpm publish:dry-run",
          "only when a maintainer approves an external Cloudflare temporary upload",
          "remote npm workflow checks recorded when this is a release PR",
        ],
      );
    },
  },
  {
    label: "issue templates cover current modules",
    action: async () => {
      return await assertFilesContainMarkers([
        {
          file: ".github/ISSUE_TEMPLATE/bug_report.yml",
          markers: [
            "database module",
            "auth module",
            "billing module",
            "storage module",
            "API keys recipe",
            "OpenAPI recipe",
            "API rate limit recipe",
            "API foundation",
          ],
        },
        {
          file: ".github/ISSUE_TEMPLATE/feature_request.yml",
          markers: [
            "base starter change",
            "module",
            "recipe",
            "test or smoke check",
            "paid or private starter code",
          ],
        },
      ]);
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
    label: "paid starter names stay in boundary docs",
    action: async () => {
      const findings = await scanTrackedFilesForRestrictedCompetitorNames();

      return {
        ok: findings.length === 0,
        detail:
          findings.length === 0
            ? "restricted names only appear in boundary guidance"
            : findings.join("\n  "),
      };
    },
  },
  {
    label: "Git remote is configured",
    external: true,
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
    external: true,
    action: async () => {
      const result = await run("pnpm", ["dlx", "wrangler", "whoami"], {
        timeoutMs: 15_000,
      });
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

for (const check of checks.filter(
  (check) =>
    (!localOnly || !check.external) &&
    (!allowDirty || !check.requiresCleanWorktree),
)) {
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
  console.log(
    localOnly ? "Local release audit passed." : "Release audit passed.",
  );
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

async function assertFilesContainMarkers(fileChecks) {
  const findings = [];

  for (const fileCheck of fileChecks) {
    const result = await assertFileContainsMarkers(
      fileCheck.file,
      fileCheck.markers,
    );

    if (!result.ok) {
      findings.push(`${fileCheck.file}: ${result.detail}`);
    }
  }

  return {
    ok: findings.length === 0,
    detail: findings.length > 0 ? findings.join("\n  ") : "all markers found",
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
  const files = await listTrackedTextCandidateFiles();
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

async function scanTrackedFilesForRestrictedCompetitorNames() {
  const files = await listTrackedTextCandidateFiles();
  const findings = [];

  for (const file of files) {
    if (allowedCompetitorReferenceFiles.has(file)) {
      continue;
    }

    const content = await readTextFileIfPossible(file);
    if (content !== null && restrictedCompetitorNames.test(content)) {
      findings.push(`${file}: restricted paid starter reference`);
    }
  }

  return findings;
}

async function listTrackedTextCandidateFiles() {
  const result = await run("git", ["ls-files"]);
  return result.stdout
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !isGeneratedOrLockFile(file));
}

function isGeneratedOrLockFile(file) {
  return (
    file === "scripts/release-audit.mjs" ||
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

async function run(command, args, options = {}) {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: process.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout =
      typeof options.timeoutMs === "number"
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
          }, options.timeoutMs)
        : null;

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolvePromise({
        code: timedOut ? 124 : code,
        stdout,
        stderr: timedOut
          ? `${stderr.trimEnd()}\nCommand timed out after ${options.timeoutMs}ms.`.trimStart()
          : stderr,
      });
    });
  });
}
