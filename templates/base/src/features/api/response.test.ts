import { describe, expect, it } from "vitest";

import { preflight, withCors } from "./cors";
import { fail, ok } from "./response";

interface TestEnvelope {
  data: Record<string, unknown> | null;
  error: { code: string; message: string } | null;
  requestId: string;
}

describe("api response helpers", () => {
  it("wraps successful responses", async () => {
    const response = ok({ status: "ok" });
    const body = (await response.json()) as TestEnvelope;

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.data?.status).toBe("ok");
    expect(body.error).toBeNull();
    expect(body.requestId).toBeTruthy();
  });

  it("wraps failed responses", async () => {
    const response = fail(
      { code: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 },
    );
    const body = (await response.json()) as TestEnvelope;

    expect(response.status).toBe(401);
    expect(body.data).toBeNull();
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });

  it("keeps CORS restrictive unless the origin is trusted", () => {
    const request = new Request("https://api.example.test/api/health", {
      headers: {
        origin: "https://app.example.test",
      },
    });

    const response = withCors(request, ok({ status: "ok" }));

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("vary")).toContain("Origin");
  });

  it("allows configured trusted origins", () => {
    const request = new Request("https://api.example.test/api/health", {
      headers: {
        origin: "https://app.example.test",
      },
    });

    const response = withCors(request, ok({ status: "ok" }), {
      trustedOrigins: "https://app.example.test, https://admin.example.test",
    });

    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://app.example.test",
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  it("responds to trusted preflight requests", () => {
    const request = new Request("https://api.example.test/api/health", {
      headers: {
        origin: "https://app.example.test",
      },
      method: "OPTIONS",
    });

    const response = preflight(request, {
      trustedOrigins: "https://app.example.test",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "GET",
    );
  });
});
