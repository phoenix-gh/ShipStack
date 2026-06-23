import { env } from "cloudflare:workers";

export function getApiTrustedOrigins() {
  return env.SHIPSTACK_TRUSTED_ORIGINS;
}
