import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const spec = createSpec();
const publicSpecPath = resolve(root, "public/openapi.json");
const generatedModulePath = resolve(root, "src/features/openapi/generated.ts");
const publicSpecContent = await formatGenerated(
  `${JSON.stringify(spec, null, 2)}\n`,
  "json",
);
const generatedModuleContent = await formatGenerated(
  `export const openApiSpec = ${JSON.stringify(spec, null, 2)} as const;\n`,
  "typescript",
);

await mkdir(resolve(root, "public"), { recursive: true });
await mkdir(resolve(root, "src/features/openapi"), { recursive: true });
await writeFile(publicSpecPath, publicSpecContent);
await writeFile(generatedModulePath, generatedModuleContent);

console.log(`Generated ${publicSpecPath}`);
console.log(`Generated ${generatedModulePath}`);

function createSpec() {
  const paths = {
    "/api/health": {
      get: {
        operationId: "getHealth",
        summary: "Health check",
        responses: {
          200: jsonResponse("Health check result", {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              service: { type: "string" },
            },
            required: ["ok", "service"],
          }),
        },
      },
    },
    "/api/v1/me": {
      get: {
        operationId: "getCurrentIdentity",
        summary: "Current session or API key identity",
        security: optionalSecurity(),
        responses: {
          200: jsonEnvelope("Current identity", {
            type: "object",
            properties: {
              authenticated: { type: "boolean" },
              authType: {
                type: ["string", "null"],
                enum: ["session", "api_key", null],
              },
              user: {
                type: ["object", "null"],
                additionalProperties: true,
              },
              apiKey: {
                type: ["object", "null"],
                additionalProperties: true,
              },
            },
            required: ["authenticated"],
          }),
          ...(hasRateLimitModule()
            ? {
                429: errorResponse("Too many requests."),
              }
            : {}),
        },
      },
    },
  };

  if (routeExists("src/routes/api.v1.api-keys.ts")) {
    paths["/api/v1/api-keys"] = {
      get: {
        operationId: "listApiKeys",
        summary: "List API keys",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonEnvelope("API keys", {
            type: "object",
            properties: {
              apiKeys: {
                type: "array",
                items: { $ref: "#/components/schemas/ApiKeySummary" },
              },
            },
            required: ["apiKeys"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
      post: {
        operationId: "createApiKey",
        summary: "Create an API key",
        security: [{ cookieAuth: [] }],
        requestBody: jsonRequest({
          type: "object",
          properties: {
            name: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
          },
        }),
        responses: {
          201: jsonEnvelope("Created API key", {
            type: "object",
            properties: {
              apiKey: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  apiKey: { $ref: "#/components/schemas/ApiKeySummary" },
                },
                required: ["key", "apiKey"],
              },
            },
            required: ["apiKey"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
      delete: {
        operationId: "revokeApiKey",
        summary: "Revoke an API key",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: jsonEnvelope("Revoked API key", {
            type: "object",
            properties: {
              apiKey: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  revoked: { type: "boolean" },
                },
                required: ["id", "revoked"],
              },
            },
            required: ["apiKey"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
    };
  }

  if (routeExists("src/routes/api.v1.files.ts")) {
    paths["/api/v1/files"] = {
      get: {
        operationId: "listFiles",
        summary: "List files",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonEnvelope("Files", {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: { $ref: "#/components/schemas/FileSummary" },
              },
            },
            required: ["files"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
      post: {
        operationId: "uploadFile",
        summary: "Upload a file",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "x-shipstack-filename",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/octet-stream": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        responses: {
          201: jsonEnvelope("Stored file", {
            type: "object",
            properties: {
              file: { $ref: "#/components/schemas/FileSummary" },
            },
            required: ["file"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
      delete: {
        operationId: "deleteFile",
        summary: "Delete a file",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: jsonEnvelope("Deleted file", {
            type: "object",
            properties: {
              file: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  deleted: { type: "boolean" },
                },
                required: ["id", "deleted"],
              },
            },
            required: ["file"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
    };
  }

  if (routeExists("src/routes/api.v1.billing.status.ts")) {
    paths["/api/v1/billing/status"] = {
      get: {
        operationId: "getBillingStatus",
        summary: "Get billing status",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonEnvelope("Billing status", {
            type: "object",
            properties: {
              billing: { $ref: "#/components/schemas/BillingStatus" },
            },
            required: ["billing"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
    };
  }

  if (routeExists("src/routes/api.v1.billing.checkout.ts")) {
    paths["/api/v1/billing/checkout"] = {
      post: {
        operationId: "createCheckoutSession",
        summary: "Create Stripe Checkout session",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonEnvelope("Checkout session", {
            type: "object",
            properties: {
              checkout: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                },
                required: ["url"],
              },
            },
            required: ["checkout"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
    };
  }

  if (routeExists("src/routes/api.v1.billing.portal.ts")) {
    paths["/api/v1/billing/portal"] = {
      post: {
        operationId: "createBillingPortalSession",
        summary: "Create Stripe Billing Portal session",
        security: [{ cookieAuth: [] }],
        responses: {
          200: jsonEnvelope("Billing portal session", {
            type: "object",
            properties: {
              portal: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                },
                required: ["url"],
              },
            },
            required: ["portal"],
          }),
          401: errorResponse("Authentication is required."),
        },
      },
    };
  }

  if (routeExists("src/routes/api.stripe.webhook.ts")) {
    paths["/api/stripe/webhook"] = {
      post: {
        operationId: "handleStripeWebhook",
        summary: "Handle Stripe webhook",
        responses: {
          200: jsonEnvelope("Webhook result", {
            type: "object",
            properties: {
              webhook: {
                type: "object",
                properties: {
                  received: { type: "boolean" },
                  duplicate: { type: "boolean" },
                },
                required: ["received"],
              },
            },
            required: ["webhook"],
          }),
          400: errorResponse("Invalid webhook payload or signature."),
        },
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "ShipStack API",
      version: "0.1.0",
    },
    servers: [{ url: "/" }],
    paths,
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
        },
        bearerApiKey: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            code: { type: "string" },
            message: { type: "string" },
          },
          required: ["code", "message"],
        },
        ApiKeySummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            keyPrefix: { type: "string" },
            lastUsedAt: { type: ["string", "null"], format: "date-time" },
            expiresAt: { type: ["string", "null"], format: "date-time" },
            revokedAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "keyPrefix", "createdAt"],
        },
        BillingStatus: {
          type: "object",
          properties: {
            active: { type: "boolean" },
            status: { type: ["string", "null"] },
            priceId: { type: ["string", "null"] },
            currentPeriodEnd: {
              type: ["string", "null"],
              format: "date-time",
            },
            cancelAtPeriodEnd: { type: "boolean" },
          },
          required: ["active", "status", "priceId", "cancelAtPeriodEnd"],
        },
        FileSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            fileName: { type: "string" },
            contentType: { type: "string" },
            size: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "fileName", "contentType", "size", "createdAt"],
        },
      },
    },
  };
}

function routeExists(routePath) {
  return existsSync(resolve(root, routePath));
}

function hasRateLimitModule() {
  return existsSync(resolve(root, "src/features/api/rate-limit.ts"));
}

function optionalSecurity() {
  if (routeExists("src/routes/api.v1.api-keys.ts")) {
    return [{ cookieAuth: [] }, { bearerApiKey: [] }, {}];
  }

  if (routeExists("src/features/auth/server.ts")) {
    return [{ cookieAuth: [] }, {}];
  }

  return [{}];
}

function jsonRequest(schema) {
  return {
    required: true,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function jsonResponse(description, schema) {
  return {
    description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

function jsonEnvelope(description, dataSchema) {
  return jsonResponse(description, {
    type: "object",
    properties: {
      data: dataSchema,
      error: { type: ["object", "null"] },
      requestId: { type: "string" },
    },
    required: ["data", "error", "requestId"],
  });
}

function errorResponse(message) {
  return jsonEnvelope(message, {
    type: "null",
  });
}

async function formatGenerated(content, parser) {
  try {
    const prettier = await import("prettier");
    return await prettier.format(content, { parser });
  } catch {
    return content;
  }
}
