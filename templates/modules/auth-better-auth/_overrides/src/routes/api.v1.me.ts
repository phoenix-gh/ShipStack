import { createFileRoute } from "@tanstack/react-router";

import { ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/me")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!import.meta.env.SSR) {
          return ok({ user: null, authenticated: false });
        }

        const { auth } = await import("~/features/auth/server");
        const session = await auth.api.getSession({ headers: request.headers });

        return ok({
          user: session?.user ?? null,
          authenticated: Boolean(session),
        });
      },
    },
  },
} as any);

