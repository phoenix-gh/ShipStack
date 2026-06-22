import { createFileRoute } from "@tanstack/react-router";

import { ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/me")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async () => {
        return ok({
          user: null,
          authenticated: false,
          note: "Install the auth module to return the current user.",
        });
      },
    },
  },
} as any);
