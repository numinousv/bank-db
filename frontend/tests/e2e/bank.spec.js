// Real user workflows in a real browser against the isolated test stack
// (web :3002, api :3101, throwaway database). Auth uses an HttpOnly
// session cookie: the browser sends it automatically, so sessions survive
// reloads but die on logout. Each flow uses a unique user so runs never
// interfere.
const { test, expect } = require("@playwright/test");

function uniqueUser(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function register(page, username, password = "secret123") {
  await page.goto("/register");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Account created")).toBeVisible();
}

async function login(page, username, password = "secret123") {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/account/);
}

async function registerAndLogin(page, username) {
  await register(page, username);
  await login(page, username);
}

async function logout(page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("logged-out visitor cannot view account or history", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login/);
});

test("register, deposit, balance and history", async ({ page }) => {
  const username = uniqueUser("e2e-flow");
  await registerAndLogin(page, username);

  // Fresh account starts at zero with an empty history.
  await expect(page.getByText("0 kr")).toBeVisible();
  await page.getByRole("link", { name: "Transaction history" }).click();
  await expect(page).toHaveURL(/\/transactions/);
  await expect(page.getByText("No transactions yet.")).toBeVisible();

  // Deposit and check the balance updates.
  await page.goto("/account");
  await page.getByLabel("Amount", { exact: true }).fill("250");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText("250 kr")).toBeVisible();

  // The deposit is reflected in the history and survives a reload.
  await page.getByRole("link", { name: "Transaction history" }).click();
  const items = page.getByTestId("transaction-item");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("Deposit");
  await expect(items.first()).toContainText("250 kr");
  await page.reload();
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("250 kr");

  // History persists after logging out and in again.
  await page.goto("/account");
  await logout(page);
  await login(page, username);
  await expect(page.getByText("250 kr")).toBeVisible();
  await page.getByRole("link", { name: "Transaction history" }).click();
  await expect(page.getByTestId("transaction-item")).toHaveCount(1);
  await expect(page.getByTestId("transaction-item").first()).toContainText(
    "250 kr",
  );
});

test("histories are isolated between users", async ({ page }) => {
  const userA = uniqueUser("e2e-iso-a");
  await registerAndLogin(page, userA);
  await page.getByLabel("Amount", { exact: true }).fill("300");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText("300 kr")).toBeVisible();
  await logout(page);

  const userB = uniqueUser("e2e-iso-b");
  await registerAndLogin(page, userB);
  // Fresh user starts empty and cannot see user A's deposit.
  await expect(page.getByText("0 kr")).toBeVisible();
  await page.getByRole("link", { name: "Transaction history" }).click();
  await expect(page.getByText("No transactions yet.")).toBeVisible();
  await page.goto("/account");
  await page.getByLabel("Amount", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText("100 kr")).toBeVisible();
  await page.getByRole("link", { name: "Transaction history" }).click();
  const itemsB = page.getByTestId("transaction-item");
  await expect(itemsB).toHaveCount(1);
  await expect(itemsB.first()).toContainText("100 kr");
  await logout(page);

  // User A still sees only their own history after logging back in.
  await login(page, userA);
  await expect(page.getByText("300 kr")).toBeVisible();
  await page.getByRole("link", { name: "Transaction history" }).click();
  const itemsA = page.getByTestId("transaction-item");
  await expect(itemsA).toHaveCount(1);
  await expect(itemsA.first()).toContainText("300 kr");
});

test("invalid deposit changes neither balance nor history", async ({
  page,
}) => {
  const username = uniqueUser("e2e-invalid");
  await registerAndLogin(page, username);

  await page.getByLabel("Amount", { exact: true }).fill("-50");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText(/greater than zero/)).toBeVisible();
  await expect(page.getByText("0 kr")).toBeVisible();

  await page.getByRole("link", { name: "Transaction history" }).click();
  await expect(page.getByText("No transactions yet.")).toBeVisible();
});

test("VG: withdraw success, denied overdraft, history after reload", async ({
  page,
}) => {
  const username = uniqueUser("e2e-withdraw");
  await registerAndLogin(page, username);

  await page.getByLabel("Amount", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText("500 kr")).toBeVisible();

  // Successful withdrawal updates the balance.
  await page.getByLabel("Withdraw amount", { exact: true }).fill("200");
  await page.getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByText("300 kr")).toBeVisible();

  // Overdraft is denied and changes nothing.
  await page.getByLabel("Withdraw amount", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByText("Insufficient funds")).toBeVisible();
  await expect(page.getByText("300 kr")).toBeVisible();

  // History distinguishes deposits from withdrawals and persists.
  await page.getByRole("link", { name: "Transaction history" }).click();
  const items = page.getByTestId("transaction-item");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("Withdrawal");
  await expect(items.first()).toContainText("200 kr");
  await expect(items.nth(1)).toContainText("Deposit");
  await page.reload();
  await expect(items).toHaveCount(2);
  await page.goto("/account");
  await expect(page.getByText("300 kr")).toBeVisible();
});

test("wrong password grants no session", async ({ page }) => {
  const username = uniqueUser("e2e-badlogin");
  await register(page, username);

  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("wrongpass1");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(/Invalid username or password/)).toBeVisible();

  // Still logged out: the account page bounces back to login.
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
});

test("tampered session cookie is rejected", async ({ page, context }) => {
  const username = uniqueUser("e2e-tampered");
  await registerAndLogin(page, username);
  await expect(page.getByText("0 kr")).toBeVisible();

  await context.addCookies([
    {
      name: "access_token",
      value: "tampered.payload.signature",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
});

test("logout revokes access in the same browser", async ({ page }) => {
  const username = uniqueUser("e2e-logout");
  await registerAndLogin(page, username);

  await page.getByLabel("Amount", { exact: true }).fill("250");
  await page.getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText("250 kr")).toBeVisible();

  await logout(page);

  // The cleared cookie no longer opens anything protected.
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login/);
});
