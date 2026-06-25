import { createHmac } from "node:crypto";
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

const webhookSecret = "billing webhook secret for local tests only";

await runSmoke("billing", async (workspace) => {
  const appDir = await createApp(workspace, "billing-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "billing"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "billing"], { cwd: appDir });
  await verifyBillingDocs(appDir);

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyGeneratedApp(appDir, { install: false });
  await verifyBillingRuntime(appDir);
});

async function verifyBillingDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseBillingDoc = await readFile(
    resolve(appDir, "docs/zh-CN/billing.md"),
    "utf8",
  );

  if (!readme.includes("[Billing](./docs/billing.md)")) {
    throw new Error("Generated README is missing billing module docs link");
  }

  if (!readme.includes("[支付](./docs/zh-CN/billing.md)")) {
    throw new Error(
      "Generated README is missing Chinese billing module docs link",
    );
  }

  if (!chineseBillingDoc.includes("STRIPE_WEBHOOK_SECRET")) {
    throw new Error(
      "Generated Chinese billing docs are missing webhook secret guidance",
    );
  }

  if (!chineseBillingDoc.includes("checkout.session.completed")) {
    throw new Error(
      "Generated Chinese billing docs are missing webhook event guidance",
    );
  }
}

async function verifyBillingRuntime(appDir) {
  const email = `billing-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";
  const cookieJar = new Map();
  const devVarsPath = resolve(appDir, ".dev.vars");

  try {
    await withDevServer(
      appDir,
      async (origin) => {
        const anonymousStatus = await fetch(`${origin}/api/v1/billing/status`);
        if (anonymousStatus.status !== 401) {
          throw new Error(
            `Expected anonymous billing status to return 401, received ${anonymousStatus.status}`,
          );
        }

        await postAuthJson(`${origin}/api/auth/sign-up/email`, cookieJar, {
          name: "Billing Tester",
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
        const userId = me.data?.user?.id;
        if (!userId) {
          throw new Error(
            `Expected authenticated user id: ${JSON.stringify(me)}`,
          );
        }

        const beforeWebhook = await getJson(
          `${origin}/api/v1/billing/status`,
          cookieJar,
        );
        if (beforeWebhook.data?.billing?.active !== false) {
          throw new Error(
            `Expected inactive billing before webhook: ${JSON.stringify(beforeWebhook)}`,
          );
        }

        const event = createSubscriptionEvent(userId);
        const webhook = await postStripeWebhook(
          `${origin}/api/stripe/webhook`,
          event,
        );
        if (
          webhook.error !== null ||
          webhook.data?.webhook?.received !== true
        ) {
          throw new Error(`Webhook failed: ${JSON.stringify(webhook)}`);
        }

        const duplicateWebhook = await postStripeWebhook(
          `${origin}/api/stripe/webhook`,
          event,
        );
        if (duplicateWebhook.data?.webhook?.duplicate !== true) {
          throw new Error(
            `Expected duplicate webhook to be idempotent: ${JSON.stringify(duplicateWebhook)}`,
          );
        }

        const afterWebhook = await getJson(
          `${origin}/api/v1/billing/status`,
          cookieJar,
        );
        if (
          afterWebhook.error !== null ||
          afterWebhook.data?.billing?.active !== true ||
          afterWebhook.data?.billing?.status !== "active"
        ) {
          throw new Error(
            `Expected active billing after webhook: ${JSON.stringify(afterWebhook)}`,
          );
        }
      },
      {
        beforeStart: async ({ origin }) => {
          await writeFile(
            devVarsPath,
            [
              'BETTER_AUTH_SECRET="billing smoke auth secret for local tests only"',
              `BETTER_AUTH_URL="${origin}"`,
              'STRIPE_SECRET_KEY="stripe secret for local smoke only"',
              `STRIPE_WEBHOOK_SECRET="${webhookSecret}"`,
              'STRIPE_PRICE_ID="price_smoke"',
              `BILLING_SUCCESS_URL="${origin}/account?checkout=success"`,
              `BILLING_CANCEL_URL="${origin}/account?checkout=cancelled"`,
              `BILLING_PORTAL_RETURN_URL="${origin}/account"`,
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

function createSubscriptionEvent(userId) {
  return {
    id: `evt_smoke_${Date.now()}`,
    object: "event",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `sub_smoke_${Date.now()}`,
        object: "subscription",
        customer: `cus_smoke_${Date.now()}`,
        status: "active",
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        cancel_at_period_end: false,
        metadata: {
          user_id: userId,
        },
        items: {
          data: [
            {
              price: {
                id: "price_smoke",
              },
            },
          ],
        },
      },
    },
  };
}

async function postStripeWebhook(url, event) {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const response = await fetch(url, {
    body: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${signature}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Stripe webhook failed ${response.status}: ${await response.text()}`,
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

  return header.split(/,(?=\s*[^;]+=)/g).map((value) => value.trim());
}
