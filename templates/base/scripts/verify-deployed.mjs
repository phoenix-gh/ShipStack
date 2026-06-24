const workerUrl = process.argv[2];

if (!workerUrl) {
  console.error("Usage: pnpm verify:deployed <worker-url>");
  process.exitCode = 1;
} else {
  await verifyDeployedWorker(workerUrl);
}

async function verifyDeployedWorker(origin) {
  const baseUrl = origin.replace(/\/+$/, "");

  await retry(async () => {
    await verifyText(`${baseUrl}/health`, {
      includes: "System health is ok.",
    });
    await verifyJson(`${baseUrl}/api/health`, (body) => {
      if (body.data?.status !== "ok" || body.error !== null) {
        throw new Error("/api/health returned an unexpected envelope");
      }
    });
    await verifyJson(`${baseUrl}/api/v1/me`, (body) => {
      if (body.data?.authenticated !== false || body.error !== null) {
        throw new Error("/api/v1/me returned an unexpected anonymous envelope");
      }
    });
  });

  console.log(`Deployment checks passed for ${baseUrl}`);
}

async function verifyText(url, options) {
  const response = await fetch(url);
  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(
      `Expected ${url} to return 200, received ${response.status}`,
    );
  }

  if (!body.includes(options.includes)) {
    throw new Error(`Expected ${url} response to include: ${options.includes}`);
  }
}

async function verifyJson(url, validate) {
  const response = await fetch(url);
  const body = await response.text();

  if (response.status !== 200) {
    throw new Error(
      `Expected ${url} to return 200, received ${response.status}`,
    );
  }

  validate(JSON.parse(body));
}

async function retry(operation) {
  const attempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        console.warn(
          `Deployment check failed on attempt ${attempt}; retrying.`,
        );
        await delay(5_000);
      }
    }
  }

  throw lastError;
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
