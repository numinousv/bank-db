import { describe, expect, test } from "vitest";
import { canWithdraw } from "../src/withdraw.js";

// VG overdraft rules, tested against the real backend module used by
// the POST /me/accounts/withdrawals route.
describe("canWithdraw", () => {
  test("allows a withdrawal smaller than the balance", () => {
    expect(canWithdraw(500, 200)).toBe(true);
  });

  test("allows withdrawing the exact full balance", () => {
    expect(canWithdraw(200, 200)).toBe(true);
  });

  test("denies a withdrawal that exceeds the balance", () => {
    expect(canWithdraw(200, 201)).toBe(false);
  });

  test("denies any withdrawal from an empty account", () => {
    expect(canWithdraw(0, 1)).toBe(false);
  });
});
