import type { SignalCheck } from "../types.js";

export function evaluateCheck(check: SignalCheck, value: unknown): boolean {
  switch (check.op) {
    case "exists":
      return value !== null && value !== undefined;
    case "not_exists":
      return value === null || value === undefined;
    case "equals":
      return value === check.value;
    case "not_equals":
      return value !== check.value;
    case "matches":
      if (typeof value !== "string") return false;
      return new RegExp(check.pattern).test(value);
    case "gt":
      return typeof value === "number" && value > check.value;
    case "lt":
      return typeof value === "number" && value < check.value;
    case "gte":
      return typeof value === "number" && value >= check.value;
    case "lte":
      return typeof value === "number" && value <= check.value;
    case "contains":
      if (typeof value === "string") return value.includes(check.value);
      return false;
    case "count_gt":
      return Array.isArray(value) && value.length > check.value;
    case "count_lt":
      return Array.isArray(value) && value.length < check.value;
    default:
      return false;
  }
}
