// Part 2: pure, independently testable amount validation.
//
// Integer kronor: the value must be a finite number greater than zero.
// Fractional input is truncated toward zero and must still leave >= 1 kr,
// because the accounts table stores integer amounts.
export function validateAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return {
      ok: false,
      error: "Amount must be a finite number greater than zero",
    };
  }
  const amount = Math.trunc(num);
  if (amount < 1) {
    return { ok: false, error: "Amount must be at least 1 kr" };
  }
  return { ok: true, amount };
}
