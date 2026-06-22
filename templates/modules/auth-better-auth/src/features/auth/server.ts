import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "cloudflare:workers";

import { createDb } from "~/db/client";

export const auth = betterAuth({
  database: drizzleAdapter(createDb(env.DB), {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;

