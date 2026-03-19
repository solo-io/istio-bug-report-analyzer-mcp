import { describe, it, expect } from "vitest";
import { findIstioctl } from "../../src/cli/bootstrap.js";

describe("findIstioctl", () => {
  it("returns a string path or null", async () => {
    const result = await findIstioctl();
    // On systems with istioctl it returns a path, otherwise null
    expect(result === null || typeof result === "string").toBe(true);
  });
});
