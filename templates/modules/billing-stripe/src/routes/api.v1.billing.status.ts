import { createFileRoute } from "@tanstack/react-router";

import { preflight, withCors } from "~/features/api/cors";
import { fail, ok } from "~/features/api/response";

export const Route = createFileRoute("/api/v1/billing/status")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const trustedOrigins = await getTrustedOrigins();

        if (!import.meta.env.SSR) {
          return withCors(request, failBillingUnavailable(), {
            trustedOrigins,
          });
        }

        const billing = await import("~/features/billing/server");

        try {
          return withCors(
            request,
            ok({
              billing: await billing.getBillingStatus(request.headers),
            }),
            { trustedOrigins },
          );
        } catch (error) {
          return withCors(request, billingError(error), { trustedOrigins });
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

function failBillingUnavailable() {
  return fail(
    {
      code: "billing_unavailable",
      message: "Billing is only available on the server.",
    },
    { status: 503 },
  );
}

function billingError(error: unknown) {
  if (isBillingError(error)) {
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
      code: "billing_error",
      message: "Billing request failed.",
    },
    { status: 500 },
  );
}

function isBillingError(error: unknown): error is {
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
