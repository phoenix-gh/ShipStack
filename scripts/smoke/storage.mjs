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

await runSmoke("storage", async (workspace) => {
  const appDir = await createApp(workspace, "storage-app");

  await run("node", [shipStackBin, "add", "database"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "auth"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "storage"], { cwd: appDir });
  await run("node", [shipStackBin, "add", "storage"], { cwd: appDir });
  await verifyStorageDocs(appDir);

  await verifyGeneratedApp(appDir, {
    build: false,
    test: false,
    typecheck: false,
  });
  await run("pnpm", ["db:generate"], { cwd: appDir });
  await run("pnpm", ["db:cf:migrate:local"], { cwd: appDir });
  await verifyGeneratedApp(appDir, { install: false });
  await verifyStorageRuntime(appDir);
});

async function verifyStorageDocs(appDir) {
  const readme = await readFile(resolve(appDir, "README.md"), "utf8");
  const chineseStorageDoc = await readFile(
    resolve(appDir, "docs/zh-CN/storage.md"),
    "utf8",
  );

  if (!readme.includes("[Storage](./docs/storage.md)")) {
    throw new Error("Generated README is missing storage module docs link");
  }

  if (!readme.includes("[存储](./docs/zh-CN/storage.md)")) {
    throw new Error(
      "Generated README is missing Chinese storage module docs link",
    );
  }

  if (!chineseStorageDoc.includes("wrangler r2 bucket create")) {
    throw new Error(
      "Generated Chinese storage docs are missing bucket setup guidance",
    );
  }

  if (!chineseStorageDoc.includes("Better Auth session")) {
    throw new Error(
      "Generated Chinese storage docs are missing auth requirement guidance",
    );
  }
}

async function verifyStorageRuntime(appDir) {
  const email = `storage-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";
  const cookieJar = new Map();
  const devVarsPath = resolve(appDir, ".dev.vars");

  try {
    await withDevServer(
      appDir,
      async (origin) => {
        const anonymousFiles = await fetch(`${origin}/api/v1/files`);
        if (anonymousFiles.status !== 401) {
          throw new Error(
            `Expected anonymous files request to return 401, received ${anonymousFiles.status}`,
          );
        }

        await postAuthJson(`${origin}/api/auth/sign-up/email`, cookieJar, {
          name: "Storage Tester",
          email,
          password,
          callbackURL: "/dashboard",
        });

        await postAuthJson(`${origin}/api/auth/sign-in/email`, cookieJar, {
          email,
          password,
          callbackURL: "/dashboard",
        });

        const beforeUpload = await getJson(`${origin}/api/v1/files`, cookieJar);
        if (
          beforeUpload.error !== null ||
          beforeUpload.data?.files?.length !== 0
        ) {
          throw new Error(
            `Expected no files before upload: ${JSON.stringify(beforeUpload)}`,
          );
        }

        const uploaded = await uploadFile(`${origin}/api/v1/files`, cookieJar);
        const fileId = uploaded.data?.file?.id;
        if (uploaded.error !== null || !fileId) {
          throw new Error(`Upload failed: ${JSON.stringify(uploaded)}`);
        }

        const afterUpload = await getJson(`${origin}/api/v1/files`, cookieJar);
        if (afterUpload.data?.files?.length !== 1) {
          throw new Error(
            `Expected one file after upload: ${JSON.stringify(afterUpload)}`,
          );
        }

        const deleted = await deleteJson(
          `${origin}/api/v1/files?id=${encodeURIComponent(fileId)}`,
          cookieJar,
        );
        if (deleted.error !== null || deleted.data?.file?.deleted !== true) {
          throw new Error(`Delete failed: ${JSON.stringify(deleted)}`);
        }

        const afterDelete = await getJson(`${origin}/api/v1/files`, cookieJar);
        if (afterDelete.data?.files?.length !== 0) {
          throw new Error(
            `Expected no files after delete: ${JSON.stringify(afterDelete)}`,
          );
        }
      },
      {
        beforeStart: async ({ origin }) => {
          await writeFile(
            devVarsPath,
            `BETTER_AUTH_SECRET="storage smoke auth secret for local tests only"\nBETTER_AUTH_URL="${origin}"\n`,
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

async function uploadFile(url, cookieJar) {
  const body = "ShipStack storage smoke file";
  const response = await fetch(url, {
    body,
    headers: {
      "content-length": String(new TextEncoder().encode(body).byteLength),
      "content-type": "text/plain",
      cookie: serializeCookies(cookieJar),
      "x-shipstack-filename": "smoke.txt",
    },
    method: "POST",
  });
  storeCookies(cookieJar, response);

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
    },
    method: "DELETE",
  });
  storeCookies(cookieJar, response);

  if (!response.ok) {
    throw new Error(
      `DELETE ${url} failed ${response.status}: ${await response.text()}`,
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
