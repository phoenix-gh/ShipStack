import { createFileRoute } from "@tanstack/react-router";

import { preflight, withCors } from "~/features/api/cors";
import { ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/me")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        return withCors(
          request,
          ok({
            user: null,
            authenticated: false,
            note: "Install the auth module to return the current user.",
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
