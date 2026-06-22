import { createFileRoute } from "@tanstack/react-router";

import { ok } from "~/features/api/response";

export const Route = createFileRoute("/api/health")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return ok({
          status: "ok",
          service: "shipstack",
          url: request.url,
        });
      },
    },
  },
} as any);
