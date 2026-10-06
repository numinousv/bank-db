import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pg from "pg";
import { validateAmount } from "./src/validateAmount.js";
import { canWithdraw } from "./src/withdraw.js";

const app = express();
const port = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generera engångslösenord
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Database or in-memory fallback
let pool;
if (DATABASE_URL) {
  try {
    pool = new pg.Pool({ connectionString: DATABASE_URL });
    await pool.query("SELECT 1");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        amount INTEGER NOT NULL DEFAULT 0
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        token TEXT NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "accountId" INTEGER REFERENCES accounts(id),
        amount INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Ansluten till PostgreSQL");
  } catch (err) {
    console.error(
      "Kunde inte ansluta till PostgreSQL, kör in-memory:",
      err.message,
    );
    pool = null;
  }
}

// Skapa användare
app.post("/users", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  if (pool) {
    try {
      const existing = await pool.query(
        "SELECT id FROM users WHERE username = $1",
        [username],
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "User already exists" });
      }

      const userResult = await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, password],
      );
      const userId = userResult.rows[0].id;
      await pool.query(
        'INSERT INTO accounts ("userId", amount) VALUES ($1, 0)',
        [userId],
      );
      return res.status(201).json({ message: "User created" });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback for tests
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: "User already exists" });
  }
  const userId = Date.now();
  users.push({ id: userId, username, password });
  accounts.push({ id: accounts.length + 1, userId, amount: 0 });
  res.status(201).json({ message: "User created" });
});

// Logga in
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body;

  if (pool) {
    try {
      const result = await pool.query(
        "SELECT id FROM users WHERE username = $1 AND password = $2",
        [username, password],
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateOTP();
      await pool.query(
        'INSERT INTO sessions ("userId", token) VALUES ($1, $2)',
        [result.rows[0].id, token],
      );
      return res.status(200).json({ token });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = generateOTP();
  sessions.push({ userId: user.id, token });
  res.status(200).json({ token });
});

// Hämta saldo
app.post("/me/accounts", async (req, res) => {
  const { token } = req.body;

  if (pool) {
    try {
      const sessionResult = await pool.query(
        'SELECT "userId" FROM sessions WHERE token = $1',
        [token],
      );
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const accountResult = await pool.query(
        'SELECT amount FROM accounts WHERE "userId" = $1',
        [sessionResult.rows[0].userId],
      );
      if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }

      return res.status(200).json({ amount: accountResult.rows[0].amount });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const account = accounts.find((a) => a.userId === session.userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  res.status(200).json({ amount: account.amount });
});

// Sätt in pengar (samma validering skyddar båda databaslägena)
app.post("/me/accounts/transactions", async (req, res) => {
  const { token, amount } = req.body;

  const check = validateAmount(amount);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const validAmount = check.amount;

  if (pool) {
    try {
      const sessionResult = await pool.query(
        'SELECT "userId" FROM sessions WHERE token = $1',
        [token],
      );
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userId = sessionResult.rows[0].userId;

      // Balance and history are updated together: either both land or neither.
      await pool.query("BEGIN");
      try {
        const accountResult = await pool.query(
          'UPDATE accounts SET amount = amount + $1 WHERE "userId" = $2 RETURNING id, amount',
          [validAmount, userId],
        );
        if (accountResult.rows.length === 0) {
          await pool.query("ROLLBACK");
          return res.status(404).json({ error: "Account not found" });
        }
        await pool.query(
          'INSERT INTO transactions ("userId", "accountId", amount, type) VALUES ($1, $2, $3, \'deposit\')',
          [userId, accountResult.rows[0].id, validAmount],
        );
        await pool.query("COMMIT");
        return res.status(200).json({ amount: accountResult.rows[0].amount });
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const account = accounts.find((a) => a.userId === session.userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  account.amount += validAmount;
  transactions.push({
    id: transactions.length + 1,
    userId: session.userId,
    accountId: account.id,
    amount: validAmount,
    type: "deposit",
    createdAt: new Date().toISOString(),
  });
  res.status(200).json({ amount: account.amount });
});

// Ta ut pengar (VG: övertrasseringsskydd)
app.post("/me/accounts/withdrawals", async (req, res) => {
  const { token, amount } = req.body;

  const check = validateAmount(amount);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const validAmount = check.amount;

  if (pool) {
    try {
      const sessionResult = await pool.query(
        'SELECT "userId" FROM sessions WHERE token = $1',
        [token],
      );
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userId = sessionResult.rows[0].userId;

      const accountResult = await pool.query(
        'SELECT id, amount FROM accounts WHERE "userId" = $1',
        [userId],
      );
      if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }
      // Nekade uttag ändrar varken saldo eller historik.
      if (!canWithdraw(accountResult.rows[0].amount, validAmount)) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      await pool.query("BEGIN");
      try {
        const updated = await pool.query(
          'UPDATE accounts SET amount = amount - $1 WHERE "userId" = $2 RETURNING id, amount',
          [validAmount, userId],
        );
        await pool.query(
          'INSERT INTO transactions ("userId", "accountId", amount, type) VALUES ($1, $2, $3, \'withdrawal\')',
          [userId, updated.rows[0].id, validAmount],
        );
        await pool.query("COMMIT");
        return res.status(200).json({ amount: updated.rows[0].amount });
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const account = accounts.find((a) => a.userId === session.userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  if (!canWithdraw(account.amount, validAmount)) {
    return res.status(400).json({ error: "Insufficient funds" });
  }
  account.amount -= validAmount;
  transactions.push({
    id: transactions.length + 1,
    userId: session.userId,
    accountId: account.id,
    amount: validAmount,
    type: "withdrawal",
    createdAt: new Date().toISOString(),
  });
  res.status(200).json({ amount: account.amount });
});

// Hämta transaktionshistorik, nyast först (401 utan/fel token)
app.post("/me/transactions", async (req, res) => {
  const { token } = req.body;

  if (pool) {
    try {
      const sessionResult = await pool.query(
        'SELECT "userId" FROM sessions WHERE token = $1',
        [token],
      );
      if (sessionResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const history = await pool.query(
        'SELECT id, amount, type, "createdAt" FROM transactions WHERE "userId" = $1 ORDER BY "createdAt" DESC, id DESC',
        [sessionResult.rows[0].userId],
      );
      return res.status(200).json({ transactions: history.rows });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const history = transactions
    .filter((t) => t.userId === session.userId)
    .sort((a, b) => b.id - a.id);
  res.status(200).json({ transactions: history });
});

// Hälsokontroll (för Docker healthcheck)
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, db: pool ? "postgres" : "in-memory" });
});

// In-memory arrays (used only when no DATABASE_URL)
const users = [];
const accounts = [];
const sessions = [];
const transactions = [];

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
  console.log(
    pool ? "Databas: PostgreSQL" : "Databas: In-memory (ingen DATABASE_URL)",
  );
});
