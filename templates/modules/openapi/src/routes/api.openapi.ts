import { createFileRoute } from "@tanstack/react-router";

import { openApiSpec } from "~/features/openapi/generated";

export const Route = createFileRoute("/api/openapi")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify(openApiSpec), {
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        });
      },
    },
  },
} as any);
