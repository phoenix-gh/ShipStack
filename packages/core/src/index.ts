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

export const coreModules = [
  baseModule,
  databaseD1Module,
  authBetterAuthModule,
] satisfies ShipStackModule[];
