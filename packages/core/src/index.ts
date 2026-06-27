export type ModuleCategory = "core" | "provider" | "recipe";

export type EnvScope = "public" | "build" | "runtime" | "local";

export interface EnvVarSpec {
  name: string;
  scope: EnvScope;
  required: boolean;
  example?: string;
  description: string;
}

export interface PackageChanges {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface FileOperation {
  kind: "create" | "create-if-missing" | "overwrite";
  source: string;
  target: string;
}

export interface WranglerD1Binding {
  type: "d1";
  binding: string;
  databaseName: string;
  databaseIdPlaceholder: string;
}

export interface WranglerR2Binding {
  type: "r2";
  binding: string;
  bucketName: string;
}

export type WranglerBindingSpec = WranglerD1Binding | WranglerR2Binding;

export interface CheckSpec {
  id: string;
  description: string;
}

export interface ShipStackModule {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  dependencies?: string[];
  conflicts?: string[];
  packages?: PackageChanges;
  env?: EnvVarSpec[];
  wrangler?: WranglerBindingSpec[];
  files?: FileOperation[];
  checks?: CheckSpec[];
}

export const baseModule: ShipStackModule = {
  id: "base",
  name: "Base TanStack Start app",
  description:
    "Minimal TanStack Start application configured for Cloudflare Workers.",
  category: "core",
  checks: [
    {
      id: "routes-directory",
      description: "Generated app has a src/routes directory.",
    },
    {
      id: "wrangler-config",
      description: "Generated app has a wrangler.jsonc file.",
    },
  ],
};

export const databaseD1Module: ShipStackModule = {
  id: "database-d1",
  name: "Cloudflare D1 database",
  description:
    "Adds Cloudflare D1, Drizzle ORM, Drizzle Kit configuration, and migration scripts.",
  category: "core",
  dependencies: ["base"],
  packages: {
    dependencies: {
      "drizzle-orm": "^0.45.2",
    },
    devDependencies: {
      "@cloudflare/workers-types": "^4.20260621.1",
      "drizzle-kit": "^0.31.10",
      dotenv: "^17.4.2",
    },
  },
  env: [
    {
      name: "CLOUDFLARE_ACCOUNT_ID",
      scope: "local",
      required: true,
      description:
        "Cloudflare account ID used by Drizzle Kit for D1 HTTP operations.",
    },
    {
      name: "CLOUDFLARE_DATABASE_ID",
      scope: "local",
      required: true,
      description: "D1 database ID used by Drizzle Kit for D1 HTTP operations.",
    },
    {
      name: "CLOUDFLARE_D1_TOKEN",
      scope: "local",
      required: true,
      description:
        "Cloudflare API token with D1 permissions for local tooling.",
    },
  ],
  wrangler: [
    {
      type: "d1",
      binding: "DB",
      databaseName: "shipstack-db",
      databaseIdPlaceholder: "replace-with-d1-database-id",
    },
  ],
  checks: [
    {
      id: "db-schema",
      description: "Generated app has a src/db/schema.ts file.",
    },
    {
      id: "d1-binding",
      description: "Generated app has a DB binding in wrangler.jsonc.",
    },
  ],
};

export const authBetterAuthModule: ShipStackModule = {
  id: "auth-better-auth",
  name: "Better Auth",
  description:
    "Adds Better Auth, a TanStack Start auth handler, auth client, and session helpers.",
  category: "core",
  dependencies: ["base", "database-d1"],
  packages: {
    dependencies: {
      "@better-auth/drizzle-adapter": "^1.6.20",
      "better-auth": "^1.6.20",
    },
  },
  env: [
    {
      name: "BETTER_AUTH_SECRET",
      scope: "runtime",
      required: true,
      description: "Secret used by Better Auth to sign and verify auth data.",
    },
    {
      name: "BETTER_AUTH_URL",
      scope: "runtime",
      required: false,
      example: "http://localhost:5173",
      description:
        "Base URL used by Better Auth for callbacks and generated URLs.",
    },
  ],
  checks: [
    {
      id: "auth-handler",
      description:
        "Generated app has a Better Auth handler mounted under /api/auth/*.",
    },
  ],
};

export const storageR2Module: ShipStackModule = {
  id: "storage-r2",
  name: "Cloudflare R2 storage",
  description:
    "Adds an authenticated R2-backed file API with D1 metadata and ownership checks.",
  category: "core",
  dependencies: ["base", "database-d1", "auth-better-auth"],
  wrangler: [
    {
      type: "r2",
      binding: "FILES",
      bucketName: "shipstack-files",
    },
  ],
  checks: [
    {
      id: "storage-schema",
      description: "Generated app has a src/db/storage-schema.ts file.",
    },
    {
      id: "r2-binding",
      description: "Generated app has a FILES R2 binding in wrangler.jsonc.",
    },
    {
      id: "files-api",
      description: "Generated app has an authenticated /api/v1/files route.",
    },
  ],
};

export const billingStripeModule: ShipStackModule = {
  id: "billing-stripe",
  name: "Stripe billing",
  description:
    "Adds Stripe Checkout, customer portal sessions, webhook-confirmed subscription state, and entitlement helpers.",
  category: "core",
  dependencies: ["base", "database-d1", "auth-better-auth"],
  env: [
    {
      name: "STRIPE_SECRET_KEY",
      scope: "runtime",
      required: true,
      description: "Stripe secret API key used by server-side billing routes.",
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      scope: "runtime",
      required: true,
      description: "Stripe webhook signing secret used to verify events.",
    },
    {
      name: "STRIPE_PRICE_ID",
      scope: "runtime",
      required: true,
      description: "Stripe recurring price ID used for Checkout sessions.",
    },
    {
      name: "BILLING_SUCCESS_URL",
      scope: "runtime",
      required: true,
      example: "http://localhost:5173/account?checkout=success",
      description: "URL Stripe redirects to after successful Checkout.",
    },
    {
      name: "BILLING_CANCEL_URL",
      scope: "runtime",
      required: true,
      example: "http://localhost:5173/account?checkout=cancelled",
      description: "URL Stripe redirects to when Checkout is cancelled.",
    },
    {
      name: "BILLING_PORTAL_RETURN_URL",
      scope: "runtime",
      required: true,
      example: "http://localhost:5173/account",
      description: "URL Stripe customer portal returns to.",
    },
  ],
  checks: [
    {
      id: "billing-schema",
      description: "Generated app has a src/db/billing-schema.ts file.",
    },
    {
      id: "checkout-api",
      description:
        "Generated app has a session-authenticated billing checkout route.",
    },
    {
      id: "stripe-webhook",
      description: "Generated app has a Stripe webhook route.",
    },
  ],
};

export const apiKeysModule: ShipStackModule = {
  id: "api-keys",
  name: "API keys",
  description:
    "Adds session-managed API keys for server-to-server, CLI, and partner API clients.",
  category: "recipe",
  dependencies: ["base", "database-d1", "auth-better-auth"],
  checks: [
    {
      id: "api-keys-schema",
      description: "Generated app has a src/db/api-keys-schema.ts file.",
    },
    {
      id: "api-keys-api",
      description:
        "Generated app has session-authenticated API key management routes.",
    },
    {
      id: "api-key-auth-helper",
      description:
        "Generated app has a reusable helper for session or API key request identity.",
    },
  ],
};

export const openApiModule: ShipStackModule = {
  id: "openapi",
  name: "OpenAPI generation",
  description:
    "Adds generated OpenAPI 3.1 documentation for installed ShipStack API routes.",
  category: "recipe",
  dependencies: ["base"],
  checks: [
    {
      id: "openapi-generator",
      description: "Generated app has a scripts/generate-openapi.mjs script.",
    },
    {
      id: "openapi-route",
      description: "Generated app serves OpenAPI JSON from /api/openapi.",
    },
    {
      id: "openapi-docs",
      description: "Generated app has OpenAPI setup and verification docs.",
    },
  ],
};

export const coreModules = [
  baseModule,
  databaseD1Module,
  authBetterAuthModule,
  storageR2Module,
  billingStripeModule,
  apiKeysModule,
  openApiModule,
] satisfies ShipStackModule[];
