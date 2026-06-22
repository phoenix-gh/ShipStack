import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "./server";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  return await auth.api.getSession({ headers });
});

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
});

