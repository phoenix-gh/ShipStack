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
  description: "Minimal TanStack Start application configured for Cloudflare Workers.",
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

