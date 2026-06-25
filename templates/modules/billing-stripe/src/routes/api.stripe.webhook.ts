import { createFileRoute } from "@tanstack/react-router";

import { fail, ok } from "~/features/api/response";

export const Route = createFileRoute("/api/stripe/webhook")({
  // TanStack Start supports server route handlers here, but the current
  // published route option types do not expose the `server` property yet.
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (!import.meta.env.SSR) {
          return fail(
            {
              code: "billing_unavailable",
              message: "Billing is only available on the server.",
            },
            { status: 503 },
          );
        }

        const billing = await import("~/features/billing/server");

        try {
          return ok({
            webhook: await billing.handleStripeWebhook(request),
          });
        } catch (error) {
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
              code: "billing_webhook_failed",
              message: "Billing webhook failed.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
} as any);

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
