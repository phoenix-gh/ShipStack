import { access, readFile, rm, writeFile } from "node:fs/promises";
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
  await verifyAuthDocs(appDir);

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

async function verifyAuthDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseAuthDoc = await readFile(
    resolve(appDir, "docs/zh-CN/auth.md"),
    "utf8",
  );

  if (!readme.includes("[Authentication](./docs/auth.md)")) {
    throw new Error("Generated README is missing auth module docs link");
  }

  if (!readme.includes("[认证](./docs/zh-CN/auth.md)")) {
    throw new Error(
      "Generated README is missing Chinese auth module docs link",
    );
  }

  if (!chineseAuthDoc.includes("requireRouteSession")) {
    throw new Error(
      "Generated Chinese auth docs are missing protected route guidance",
    );
  }

  if (!chineseAuthDoc.includes("GOOGLE_CLIENT_SECRET")) {
    throw new Error(
      "Generated Chinese auth docs are missing optional OAuth guidance",
    );
  }
}

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

        await verifyAuthBrowserFlow(origin);
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

async function verifyAuthBrowserFlow(origin) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    executablePath: await findBrowserExecutable(),
    headless: true,
  });
  const email = `browser-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";

  try {
    const page = await browser.newPage();
    const browserEvents = collectBrowserEvents(page);

    await page.goto(`${origin}/sign-up`);
    await waitForHydration(page);
    await page.getByRole("link", { name: "Dashboard" }).click();
    await page.waitForURL("**/dashboard");
    await expectPageText(page, "Sign in required.", browserEvents);
    await page.getByRole("link", { name: "Create account" }).click();
    await page.waitForURL("**/sign-up");
    await waitForHydration(page);

    await page.getByLabel("Name").fill("Browser Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await submitAuthForm(page, "Create account", "/api/auth/sign-up/email");
    await page.goto(`${origin}/dashboard`);
    await waitForHydration(page);
    await expectPageText(page, `Welcome, Browser Tester.`, browserEvents);
    await expectPageText(page, email, browserEvents);

    await page.getByRole("link", { name: "Account" }).click();
    await page.waitForURL("**/account");
    await page.getByText(email).waitFor();
    await page.getByRole("button", { name: "Sign out" }).click({
      force: true,
    });
    await page.waitForURL("**/sign-in");
    await waitForHydration(page);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await submitAuthForm(page, "Sign in", "/api/auth/sign-in/email");
    await page.goto(`${origin}/dashboard`);
    await waitForHydration(page);
    await expectPageText(page, `Welcome, Browser Tester.`, browserEvents);
  } finally {
    await browser.close();
  }
}

function collectBrowserEvents(page) {
  const events = [];
  const push = (event) => {
    events.push(event);
    if (events.length > 80) {
      events.splice(0, events.length - 80);
    }
  };

  page.on("console", (message) => {
    push(`console ${message.type()}: ${message.text()}`);
  });
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      push(`navigated ${frame.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    push(
      `request failed ${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
    );
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/auth") || url.includes("/api/v1/me")) {
      push(
        `response ${response.status()} ${response.request().method()} ${url}`,
      );
    }
  });

  return events;
}

async function submitAuthForm(page, buttonName, apiPath) {
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(apiPath) && response.ok(),
    ),
    page.getByRole("button", { name: buttonName }).click(),
  ]);
}

async function expectPageText(page, text, browserEvents = []) {
  try {
    await page.getByText(text).waitFor();
  } catch (error) {
    const body = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    throw new Error(
      `Expected page to include ${JSON.stringify(text)} at ${page.url()}.\n\n${body}\n\nBrowser events:\n${browserEvents.join("\n")}`,
      { cause: error },
    );
  }
}

async function waitForHydration(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {
    // SPA navigations may not fire a fresh DOMContentLoaded event.
  });
  await page.waitForTimeout(500);
}

async function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return undefined;
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
