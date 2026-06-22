import { describe, expect, it } from "vitest";

import { healthChecks } from "./schema";

describe("database schema", () => {
  it("exports the health_checks table", () => {
    expect(healthChecks).toBeTruthy();
  });
});

