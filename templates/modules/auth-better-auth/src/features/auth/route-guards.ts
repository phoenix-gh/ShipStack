import { redirect } from "@tanstack/react-router";

import { getSession } from "./session";

interface RequireRouteSessionOptions {
  redirectTo?: string;
}

export async function requireRouteSession() {
  return await createRouteSessionGuard()();
}

export function createRouteSessionGuard(
  options: RequireRouteSessionOptions = {},
) {
  return async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({
        to: options.redirectTo ?? "/sign-in",
      });
    }

    return session;
  };
}
