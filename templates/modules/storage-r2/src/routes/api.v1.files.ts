import { createFileRoute } from "@tanstack/react-router";

import { preflight, withCors } from "~/features/api/cors";
import { fail, ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/files")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failStorageUnavailable(), {
            trustedOrigins,
          });
        }

        const storage = await import("~/features/storage/server");

        try {
          return withCors(
            request,
            ok({ files: await storage.listFiles(request.headers) }),
            {
              trustedOrigins,
            },
          );
        } catch (error) {
          return withCors(request, storageError(error), { trustedOrigins });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failStorageUnavailable(), {
            trustedOrigins,
          });
        }

        const storage = await import("~/features/storage/server");

        try {
          return withCors(
            request,
            ok(
              { file: await storage.storeFile(request.headers, request) },
              { status: 201 },
            ),
            {
              trustedOrigins,
            },
          );
        } catch (error) {
          return withCors(request, storageError(error), { trustedOrigins });
        }
      },
      DELETE: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failStorageUnavailable(), {
            trustedOrigins,
          });
        }

        const storage = await import("~/features/storage/server");
        const url = new URL(request.url);

        try {
          return withCors(
            request,
            ok({
              file: await storage.deleteFile(
                request.headers,
                url.searchParams.get("id"),
              ),
            }),
            { trustedOrigins },
          );
        } catch (error) {
          return withCors(request, storageError(error), { trustedOrigins });
        }
      },
      OPTIONS: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        return preflight(request, {
          trustedOrigins,
        });
      },
    },
  },
} as any);

async function getTrustedOrigins() {
  if (!import.meta.env.SSR) {
    return undefined;
  }

  const { getApiTrustedOrigins } =
    await import("~/features/api/runtime-env.server");
  return getApiTrustedOrigins();
}

function storageError(error: unknown) {
  if (isStorageError(error)) {
    return fail(
      {
        code: error.code,
        message: error.message,
      },
      { status: error.status },
    );
  }

  return fail(
    {
      code: "storage_error",
      message: "Storage request failed.",
    },
    { status: 500 },
  );
}

function failStorageUnavailable() {
  return fail(
    {
      code: "storage_unavailable",
      message: "Storage is only available on the server.",
    },
    { status: 503 },
  );
}

function isStorageError(error: unknown): error is {
  code: string;
  message: string;
  status: number;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "status" in error
  );
}
