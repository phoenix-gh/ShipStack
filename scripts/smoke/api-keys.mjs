import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
  withDevServer,
} from "./lib.mjs";

await runSmoke("api-keys", async (workspace) => {
  const appDir = await createApp(workspace, "api-keys-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "api-keys"], { cwd: appDir });
  await verifyApiKeysDocs(appDir);

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyGeneratedApp(appDir, { install: false });
  await verifyApiKeysRuntime(appDir);
});

async function verifyApiKeysDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseApiKeysDoc = await readFile(
    resolve(appDir, "docs/zh-CN/api-keys.md"),
    "utf8",
  );

  if (!readme.includes("[API Keys](./docs/api-keys.md)")) {
    throw new Error("Generated README is missing API keys module docs link");
  }

  if (!readme.includes("[API Keys](./docs/zh-CN/api-keys.md)")) {
    throw new Error(
      "Generated README is missing Chinese API keys module docs link",
    );
  }

  if (!chineseApiKeysDoc.includes("Authorization: Bearer")) {
    throw new Error(
      "Generated Chinese API keys docs are missing bearer auth guidance",
    );
  }
}

async function verifyApiKeysRuntime(appDir) {
  const email = `api-keys-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";
  const cookieJar = new Map();
  const devVarsPath = resolve(appDir, ".dev.vars");

  try {
    await withDevServer(
      appDir,
      async (origin) => {
        const anonymousKeys = await fetch(`${origin}/api/v1/api-keys`);
        if (anonymousKeys.status !== 401) {
          throw new Error(
            `Expected anonymous API keys list to return 401, received ${anonymousKeys.status}`,
          );
        }

        await postAuthJson(`${origin}/api/auth/sign-up/email`, cookieJar, {
          name: "API Keys Tester",
          email,
          password,
          callbackURL: "/dashboard",
        });

        await postAuthJson(`${origin}/api/auth/sign-in/email`, cookieJar, {
          email,
          password,
          callbackURL: "/dashboard",
        });

        const created = await postJson(`${origin}/api/v1/api-keys`, cookieJar, {
          name: "Smoke key",
        });
        const plaintextKey = created.data?.apiKey?.key;
        const keyRecord = created.data?.apiKey?.apiKey;
        if (
          created.error !== null ||
          typeof plaintextKey !== "string" ||
          !plaintextKey.startsWith("ss_") ||
          !keyRecord?.id
        ) {
          throw new Error(
            `Expected created API key: ${JSON.stringify(created)}`,
          );
        }

        const listed = await getJson(`${origin}/api/v1/api-keys`, cookieJar);
        if (
          listed.error !== null ||
          listed.data?.apiKeys?.length !== 1 ||
          listed.data.apiKeys[0].keyPrefix !== plaintextKey.slice(0, 12)
        ) {
          throw new Error(`Expected listed API key: ${JSON.stringify(listed)}`);
        }

        const me = await getJson(`${origin}/api/v1/me`, new Map(), {
          authorization: `Bearer ${plaintextKey}`,
        });
        if (
          me.error !== null ||
          me.data?.authenticated !== true ||
          me.data?.authType !== "api_key" ||
          me.data?.user?.id === undefined ||
          me.data?.apiKey?.id !== keyRecord.id
        ) {
          throw new Error(`Expected API key identity: ${JSON.stringify(me)}`);
        }

        const revoked = await deleteJson(
          `${origin}/api/v1/api-keys?id=${encodeURIComponent(keyRecord.id)}`,
          cookieJar,
        );
        if (revoked.error !== null || revoked.data?.apiKey?.revoked !== true) {
          throw new Error(
            `Expected revoked API key: ${JSON.stringify(revoked)}`,
          );
        }

        const revokedMe = await getJson(`${origin}/api/v1/me`, new Map(), {
          authorization: `Bearer ${plaintextKey}`,
        });
        if (
          revokedMe.error !== null ||
          revokedMe.data?.authenticated !== false ||
          revokedMe.data?.authType !== null
        ) {
          throw new Error(
            `Expected revoked API key to be anonymous: ${JSON.stringify(revokedMe)}`,
          );
        }
      },
      {
        beforeStart: async ({ origin }) => {
          await writeFile(
            devVarsPath,
            [
              'BETTER_AUTH_SECRET="api keys smoke auth secret for local tests only"',
              `BETTER_AUTH_URL="${origin}"`,
              "",
            ].join("\n"),
          );
        },
      },
    );
  } finally {
    await rm(devVarsPath, { force: true });
  }
}

async function postJson(url, cookieJar, body) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: serializeCookies(cookieJar),
      origin: new URL(url).origin,
      referer: `${new URL(url).origin}/dashboard`,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `POST ${url} failed ${response.status}: ${await response.text()}`,
    );
  }

  return await response.json();
}

async function deleteJson(url, cookieJar) {
  const response = await fetch(url, {
    headers: {
      cookie: serializeCookies(cookieJar),
      origin: new URL(url).origin,
      referer: `${new URL(url).origin}/dashboard`,
    },
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      `DELETE ${url} failed ${response.status}: ${await response.text()}`,
    );
  }

  return await response.json();
}

async function getJson(url, cookieJar, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: {
      cookie: serializeCookies(cookieJar),
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GET ${url} failed ${response.status}: ${await response.text()}`,
    );
  }

  return await response.json();
}

async function postAuthJson(url, cookieJar, body) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: serializeCookies(cookieJar),
      origin: new URL(url).origin,
      referer: `${new URL(url).origin}/sign-in`,
    },
    method: "POST",
    redirect: "manual",
  });

  collectCookies(response, cookieJar);

  if (response.status >= 400) {
    throw new Error(
      `Auth request failed ${response.status}: ${await response.text()}`,
    );
  }
}

function collectCookies(response, cookieJar) {
  const setCookie = response.headers.getSetCookie?.() ?? [];

  for (const cookie of setCookie) {
    const [pair] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0) {
      cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

function serializeCookies(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}
