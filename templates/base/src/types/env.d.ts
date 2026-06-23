interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace Cloudflare {
  interface Env {
    SHIPSTACK_TRUSTED_ORIGINS?: string;
  }
}

declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;
}
