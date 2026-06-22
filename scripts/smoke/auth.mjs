import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createApp,
  run,
  runSmoke,
  shipStackBin,
  verifyGeneratedApp,
  withDevServer,
} from "./lib.mjs";

await runSmoke("auth", async (workspace) => {
  const appDir = await createApp(workspace, "auth-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyAuthRuntime(appDir);
  await verifyGeneratedApp(appDir, { install: false });
});

async function verifyAuthRuntime(appDir) {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";
  const cookieJar = new Map();
  const devVarsPath = resolve(appDir, ".dev.vars");

  try {
    await withDevServer(
      appDir,
      async (origin) => {
        await expectRedirect(`${origin}/dashboard`, "/sign-in");

        await postAuthJson(`${origin}/api/auth/sign-up/email`, cookieJar, {
          name: "Smoke Tester",
          email,
          password,
          callbackURL: "/dashboard",
        });

        await postAuthJson(`${origin}/api/auth/sign-in/email`, cookieJar, {
          email,
          password,
          callbackURL: "/dashboard",
        });

        const me = await getJson(`${origin}/api/v1/me`, cookieJar);
        if (me.error !== null || me.data?.authenticated !== true) {
          throw new Error(
            `/api/v1/me did not return an authenticated user: ${JSON.stringify(me)}`,
          );
        }

        if (me.data.user?.email !== email) {
          throw new Error(
            `/api/v1/me returned the wrong user: ${JSON.stringify(me.data.user)}`,
          );
        }
      },
      {
        beforeStart: async ({ origin }) => {
          await writeFile(
            devVarsPath,
            `BETTER_AUTH_SECRET="shipstack-smoke-secret-at-least-32-characters"\nBETTER_AUTH_URL="${origin}"\n`,
          );
        },
      },
    );
  } finally {
    await rm(devVarsPath, { force: true });
  }
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
  storeCookies(cookieJar, response);

  if (response.status >= 400) {
    throw new Error(
      `Auth request failed ${response.status}: ${await response.text()}`,
    );
  }
}

async function getJson(url, cookieJar) {
  const response = await fetch(url, {
    headers: {
      cookie: serializeCookies(cookieJar),
    },
  });
  storeCookies(cookieJar, response);

  if (!response.ok) {
    throw new Error(
      `GET ${url} failed ${response.status}: ${await response.text()}`,
    );
  }

  return await response.json();
}

async function expectRedirect(url, expectedPath) {
  const response = await fetch(url, {
    redirect: "manual",
  });

  if (response.status < 300 || response.status >= 400) {
    throw new Error(`Expected ${url} to redirect, received ${response.status}`);
  }

  const location = response.headers.get("location");
  if (!location?.includes(expectedPath)) {
    throw new Error(
      `Expected redirect to include ${expectedPath}, received ${location}`,
    );
  }
}

function storeCookies(cookieJar, response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : splitSetCookieHeader(response.headers.get("set-cookie"));

  for (const setCookie of setCookies) {
    const [cookie] = setCookie.split(";");
    const separator = cookie.indexOf("=");
    if (separator === -1) {
      continue;
    }

    cookieJar.set(cookie.slice(0, separator), cookie.slice(separator + 1));
  }
}

function serializeCookies(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function splitSetCookieHeader(header) {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^;,]+=)/g);
}
