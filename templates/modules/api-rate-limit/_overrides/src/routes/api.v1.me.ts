import { createFileRoute } from "@tanstack/react-router";

import { preflight, withCors } from "~/features/api/cors";
import {
  checkRateLimit,
  getClientRateLimitKey,
  rateLimitResponse,
} from "~/features/api/rate-limit";
import { ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/me")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(
            request,
            ok({
              user: null,
              authenticated: false,
              authType: null,
              apiKey: null,
            }),
            { trustedOrigins },
          );
        }

        const rateLimit = checkRateLimit(request, {
          key: getClientRateLimitKey(request, "api:v1:me"),
          limit: 10,
          windowSeconds: 60,
        });

        if (!rateLimit.allowed) {
          return withCors(request, rateLimitResponse(rateLimit), {
            trustedOrigins,
          });
        }

        const { identifyRequest } = await import("~/features/api-keys/server");
        const identity = await identifyRequest(request.headers);

        return withCors(
          request,
          ok({
            user: identity.user,
            authenticated: identity.authenticated,
            authType: identity.authType,
            apiKey: identity.apiKey,
          }),
          {
            trustedOrigins,
          },
        );
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
