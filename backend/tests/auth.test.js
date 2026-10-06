import { describe, expect, test } from "vitest";
import { getUserIdFromClaims } from "../src/auth.js";

// Tests the real backend module (not a copy): requireAuth in server.js
// uses getUserIdFromClaims after verifying the JWT signature, so these
// cases guard which tokens are accepted as identifying a user.
describe("getUserIdFromClaims", () => {
  test("accepts a numeric id string", () => {
    expect(getUserIdFromClaims({ sub: "42" })).toEqual({
      ok: true,
      userId: 42,
    });
  });

  test("rejects a non-object payload", () => {
    expect(getUserIdFromClaims(null).ok).toBe(false);
    expect(getUserIdFromClaims("42").ok).toBe(false);
    expect(getUserIdFromClaims([{ sub: "1" }]).ok).toBe(false);
  });

  test("rejects a missing or non-string sub", () => {
    expect(getUserIdFromClaims({}).ok).toBe(false);
    expect(getUserIdFromClaims({ sub: 42 }).ok).toBe(false);
  });

  test("rejects a non-numeric sub", () => {
    expect(getUserIdFromClaims({ sub: "abc" }).ok).toBe(false);
  });

  test("rejects zero, negative and fractional ids", () => {
    expect(getUserIdFromClaims({ sub: "0" }).ok).toBe(false);
    expect(getUserIdFromClaims({ sub: "-3" }).ok).toBe(false);
    expect(getUserIdFromClaims({ sub: "2.5" }).ok).toBe(false);
  });
});
