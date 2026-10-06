// VG: overdraft protection as a pure, testable rule.
//
// Withdrawing exactly the full balance is allowed; only amounts that
// exceed the balance are rejected. Failed withdrawals must not change
// the balance or create a transaction record (enforced in the route).
export function canWithdraw(balance, amount) {
  const current = Number(balance);
  return Number.isFinite(current) && current >= amount;
}
