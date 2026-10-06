import { describe, expect, test } from "vitest";
import { validateAmount } from "../src/validateAmount.js";

// Tests the real backend module (not a copy): the deposit and withdrawal
// routes both call validateAmount, so these cases guard live behavior.
describe("validateAmount", () => {
  test("accepts a valid amount", () => {
    expect(validateAmount(250)).toEqual({ ok: true, amount: 250 });
  });

  test("accepts a numeric string", () => {
    expect(validateAmount("100")).toEqual({ ok: true, amount: 100 });
  });

  test("rejects zero", () => {
    const result = validateAmount(0);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/greater than zero/);
  });

  test("rejects a negative number", () => {
    const result = validateAmount(-50);
    expect(result.ok).toBe(false);
  });

  test("rejects NaN", () => {
    expect(validateAmount(NaN).ok).toBe(false);
  });

  test("rejects Infinity", () => {
    expect(validateAmount(Infinity).ok).toBe(false);
  });

  test("rejects non-numeric input", () => {
    expect(validateAmount("abc").ok).toBe(false);
  });
});
