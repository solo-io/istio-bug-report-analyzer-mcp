import { describe, it, expect } from "vitest";
import { evaluateCheck } from "../../src/diagnostics/signals.js";

describe("evaluateCheck", () => {
  it("exists — returns true for non-null values", () => {
    expect(evaluateCheck({ op: "exists" }, "some value")).toBe(true);
    expect(evaluateCheck({ op: "exists" }, null)).toBe(false);
    expect(evaluateCheck({ op: "exists" }, undefined)).toBe(false);
  });

  it("not_exists — returns true for null/undefined", () => {
    expect(evaluateCheck({ op: "not_exists" }, null)).toBe(true);
    expect(evaluateCheck({ op: "not_exists" }, "value")).toBe(false);
  });

  it("equals — strict comparison", () => {
    expect(evaluateCheck({ op: "equals", value: 3 }, 3)).toBe(true);
    expect(evaluateCheck({ op: "equals", value: "foo" }, "foo")).toBe(true);
    expect(evaluateCheck({ op: "equals", value: 3 }, 4)).toBe(false);
  });

  it("matches — regex match", () => {
    expect(evaluateCheck({ op: "matches", pattern: "^error" }, "error: something")).toBe(true);
    expect(evaluateCheck({ op: "matches", pattern: "^error" }, "warning: something")).toBe(false);
  });

  it("gt/lt/gte/lte — numeric comparisons", () => {
    expect(evaluateCheck({ op: "gt", value: 5 }, 10)).toBe(true);
    expect(evaluateCheck({ op: "gt", value: 5 }, 5)).toBe(false);
    expect(evaluateCheck({ op: "gte", value: 5 }, 5)).toBe(true);
    expect(evaluateCheck({ op: "lt", value: 10 }, 5)).toBe(true);
    expect(evaluateCheck({ op: "lte", value: 10 }, 10)).toBe(true);
  });

  it("contains — string containment", () => {
    expect(evaluateCheck({ op: "contains", value: "error" }, "there was an error here")).toBe(true);
    expect(evaluateCheck({ op: "contains", value: "error" }, "all good")).toBe(false);
  });

  it("count_gt / count_lt — array length", () => {
    expect(evaluateCheck({ op: "count_gt", value: 2 }, [1, 2, 3])).toBe(true);
    expect(evaluateCheck({ op: "count_gt", value: 5 }, [1, 2, 3])).toBe(false);
    expect(evaluateCheck({ op: "count_lt", value: 5 }, [1, 2, 3])).toBe(true);
  });
});
