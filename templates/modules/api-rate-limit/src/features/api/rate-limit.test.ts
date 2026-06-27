import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  getClientRateLimitKey,
  rateLimitHeaders,
  rateLimitResponse,
  resetRateLimitStoreForTests,
} from "./rate-limit";

describe("api rate limit helpers", () => {
  it("allows requests until the fixed window limit is reached", () => {
    resetRateLimitStoreForTests();
    const request = new Request("https://api.example.test/api/v1/me", {
      headers: {
        "cf-connecting-ip": "203.0.113.10",
      },
    });

    const first = checkRateLimit(request, {
      key: getClientRateLimitKey(request, "api:v1:me"),
      limit: 2,
      windowSeconds: 60,
    });
    const second = checkRateLimit(request, {
      key: getClientRateLimitKey(request, "api:v1:me"),
      limit: 2,
      windowSeconds: 60,
    });
    const third = checkRateLimit(request, {
      key: getClientRateLimitKey(request, "api:v1:me"),
      limit: 2,
      windowSeconds: 60,
    });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses route scope and client metadata for default keys", () => {
    const request = new Request("https://api.example.test/api/v1/me", {
      headers: {
        "x-forwarded-for": "203.0.113.20, 198.51.100.10",
      },
    });

    expect(getClientRateLimitKey(request, "api:v1:me")).toBe(
      "api:v1:me:203.0.113.20",
    );
  });

  it("returns JSON API errors with retry metadata", async () => {
    resetRateLimitStoreForTests();
    const request = new Request("https://api.example.test/api/v1/me");
    checkRateLimit(request, {
      key: "api:v1:me:test-client",
      limit: 1,
      windowSeconds: 60,
    });

    const result = checkRateLimit(request, {
      key: "api:v1:me:test-client",
      limit: 1,
      windowSeconds: 60,
    });
    const response = rateLimitResponse(result);
    const body = (await response.json()) as {
      error?: {
        code?: string;
      };
    };

    expect(response.status).toBe(429);
    expect(rateLimitHeaders(result)["x-ratelimit-limit"]).toBe("1");
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(body.error?.code).toBe("RATE_LIMITED");
  });
});
