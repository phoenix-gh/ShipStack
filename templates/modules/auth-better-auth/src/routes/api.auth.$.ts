import { createFileRoute } from "@tanstack/react-router";

async function getAuth() {
  if (!import.meta.env.SSR) {
    throw new Error("Auth handlers are server-only.");
  }

  const { auth } = await import("~/features/auth/server");
  return auth;
}

export const Route = createFileRoute("/api/auth/$")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
    },
  },
} as any);
