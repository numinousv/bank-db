// Pure, independently testable JWT claim validation.
//
// requireAuth (server.js) verifies the signature/expiry/issuer/audience
// with jsonwebtoken first, then uses this function to check that the
// verified payload actually identifies a user.
export function getUserIdFromClaims(payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Token payload must be an object" };
  }
  if (typeof payload.sub !== "string") {
    return { ok: false, error: "Token subject must be a user id string" };
  }
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { ok: false, error: "Token subject must be a positive integer id" };
  }
  return { ok: true, userId };
}
