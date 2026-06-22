import { describe, expect, it } from "vitest";

import { fail, ok } from "./response";

describe("api response helpers", () => {
  it("wraps successful responses", async () => {
    const response = ok({ status: "ok" });
    const body = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.data.status).toBe("ok");
    expect(body.error).toBeNull();
    expect(body.requestId).toBeTruthy();
  });

  it("wraps failed responses", async () => {
    const response = fail(
      { code: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.data).toBeNull();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

