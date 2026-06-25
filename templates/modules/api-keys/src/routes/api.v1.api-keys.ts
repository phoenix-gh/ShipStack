import { createFileRoute } from "@tanstack/react-router";

import { preflight, withCors } from "~/features/api/cors";
import { fail, ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/api-keys")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failApiKeysUnavailable(), {
            trustedOrigins,
          });
        }

        const apiKeys = await import("~/features/api-keys/server");

        try {
          return withCors(
            request,
            ok({ apiKeys: await apiKeys.listApiKeys(request.headers) }),
            { trustedOrigins },
          );
        } catch (error) {
          return withCors(request, apiKeysError(error), { trustedOrigins });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failApiKeysUnavailable(), {
            trustedOrigins,
          });
        }

        const apiKeys = await import("~/features/api-keys/server");

        try {
          return withCors(
            request,
            ok(
              { apiKey: await apiKeys.createApiKey(request.headers, request) },
              { status: 201 },
            ),
            { trustedOrigins },
          );
        } catch (error) {
          return withCors(request, apiKeysError(error), { trustedOrigins });
        }
      },
      DELETE: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failApiKeysUnavailable(), {
            trustedOrigins,
          });
        }

        const apiKeys = await import("~/features/api-keys/server");
        const url = new URL(request.url);

        try {
          return withCors(
            request,
            ok({
              apiKey: await apiKeys.revokeApiKey(
                request.headers,
                url.searchParams.get("id"),
              ),
            }),
            { trustedOrigins },
          );
        } catch (error) {
          return withCors(request, apiKeysError(error), { trustedOrigins });
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

function failApiKeysUnavailable() {
  return fail(
    {
      code: "api_keys_unavailable",
      message: "API keys are only available on the server.",
    },
    { status: 503 },
  );
}

function apiKeysError(error: unknown) {
  if (isApiKeysError(error)) {
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
      code: "api_keys_error",
      message: "API keys request failed.",
    },
    { status: 500 },
  );
}

function isApiKeysError(error: unknown): error is {
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
