import {
  createApp,
  run,
  runAndCapture,
  runSmoke,
  verifyGeneratedApp,
} from "./lib.mjs";

await runSmoke("temporary-deploy", async (workspace) => {
  const appDir = await createApp(workspace, "temporary-deploy-app");

  await verifyGeneratedApp(appDir, { build: false });
  await run("pnpm", ["build"], { cwd: appDir });

  const result = await runTemporaryDeploy(appDir);
  const workerUrl = findWorkerUrl(result.output);

  await run("pnpm", ["verify:deployed", workerUrl], { cwd: appDir });
});

async function runTemporaryDeploy(appDir) {
  return await retry(
    async () => {
      const result = await runAndCapture(
        "pnpm",
        ["exec", "wrangler", "deploy", "--temporary"],
        { cwd: appDir },
      );
      const sanitizedOutput = result.output.replace(
        /^(\s*Claim URL:\s*).+$/gm,
        "$1<redacted>",
      );

      console.log(sanitizedOutput);

      if (result.code !== 0) {
        throw new Error(
          `Temporary deploy failed with exit code ${result.code}. See output above.`,
        );
      }

      return result;
    },
    { label: "temporary deploy" },
  );
}

function findWorkerUrl(output) {
  const match = output.match(
    /https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.workers\.dev\b/i,
  );

  if (!match) {
    throw new Error(
      "Temporary deploy output did not include a workers.dev URL",
    );
  }

  return match[0];
}

async function retry(operation, options) {
  const attempts = options.attempts ?? 3;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(
        `${options.label} failed on attempt ${attempt}; retrying in 10s.`,
      );
      await delay(10_000);
    }
  }

  throw lastError;
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
