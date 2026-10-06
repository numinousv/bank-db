import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import { validateAmount } from "./src/validateAmount.js";
import { canWithdraw } from "./src/withdraw.js";
import { getUserIdFromClaims } from "./src/auth.js";

const app = express();
const port = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

// JWT settings. The secret must be at least 32 bytes; the server refuses
// to start without one so it can never run with an insecure default.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be set to at least 32 bytes");
}
const JWT_ISSUER = "banken";
const JWT_AUDIENCE = "banken-api";
const JWT_EXPIRES_IN = "15m";
const COOKIE_NAME = "access_token";
const COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
// Browsers reject Secure cookies on plain HTTP, so this is only enabled
// where the site actually runs over HTTPS.
// Compared against when the username is unknown, so that wrong-username
// and wrong-password logins take equally long.
const DUMMY_HASH = await bcrypt.hash("invalid-login-dummy-value", 12);
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
// Exact browser origins allowed to call the API with cookies.
// Ports matter for CORS: 127.0.0.1:3002 and localhost:3000 are different
// origins, so every address the frontend is served from must be listed.
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN ||
  "http://127.0.0.1:3000,http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests and tools like curl send no Origin header.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(bodyParser.json());

// Cookie options shared by login (set) and logout (clear).
function cookieOptions() {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

// Protected routes use this instead of trusting any id from the client.
// On success the verified user id is available as req.userId.
function requireAuth(req, res, next) {
  const header = req.get("authorization");
  let token = null;
  if (header && header.startsWith("Bearer ")) {
    token = header.slice("Bearer ".length).trim();
  } else if (req.cookies && typeof req.cookies[COOKIE_NAME] === "string") {
    token = req.cookies[COOKIE_NAME];
  }
  if (!token) {
    return res.status(401).json({ error: "Login required" });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  const check = getUserIdFromClaims(payload);
  if (!check.ok) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = check.userId;
  return next();
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
        password_hash TEXT NOT NULL
      )
    `);
    // Databases created before the JWT migration have a plaintext
    // "password" column instead. Fresh databases are recreated with
    // `docker compose down -v`; this ALTER only helps instances that
    // were never wiped (old rows still need re-registration).
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        amount INTEGER NOT NULL DEFAULT 0
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

// Skapa användare (lösenordet hashas med bcrypt innan det sparas)
app.post("/users", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const passwordHash = await bcrypt.hash(password, 12);

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
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id",
        [username, passwordHash],
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
  users.push({ id: userId, username, password_hash: passwordHash });
  accounts.push({ id: accounts.length + 1, userId, amount: 0 });
  res.status(201).json({ message: "User created" });
});

// Logga in (jämför med hashen, svara med JWT i HttpOnly-cookie)
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body;

  const findUser = async () => {
    if (pool) {
      const result = await pool.query(
        "SELECT id, username, password_hash FROM users WHERE username = $1",
        [username],
      );
      return result.rows[0] || null;
    }
    return users.find((u) => u.username === username) || null;
  };

  try {
    const user = await findUser();
    // Same response whether the username is unknown or the password is
    // wrong, so callers cannot probe for existing usernames. The dummy
    // compare keeps response times similar in both cases.
    const passwordIsCorrect = await bcrypt.compare(
      typeof password === "string" ? password : "",
      user && user.password_hash ? user.password_hash : DUMMY_HASH,
    );
    if (!user || !passwordIsCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ sub: String(user.id) }, JWT_SECRET, {
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: JWT_EXPIRES_IN,
    });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res
      .status(200)
      .json({ message: "Login successful", username: user.username });
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

// Logga ut (rensar cookien med samma inställningar som när den sattes)
app.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out" });
});

// Hämta saldo
app.post("/me/accounts", requireAuth, async (req, res) => {
  const userId = req.userId;

  if (pool) {
    try {
      const accountResult = await pool.query(
        'SELECT amount FROM accounts WHERE "userId" = $1',
        [userId],
      );
      if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
      }
      const userResult = await pool.query(
        "SELECT username FROM users WHERE id = $1",
        [userId],
      );

      return res.status(200).json({
        amount: accountResult.rows[0].amount,
        username: userResult.rows[0] ? userResult.rows[0].username : null,
      });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const account = accounts.find((a) => a.userId === userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  const user = users.find((u) => u.id === userId);
  res
    .status(200)
    .json({ amount: account.amount, username: user ? user.username : null });
});

// Sätt in pengar (samma validering skyddar båda databaslägena)
app.post("/me/accounts/transactions", requireAuth, async (req, res) => {
  const { amount } = req.body;

  const check = validateAmount(amount);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const validAmount = check.amount;
  const userId = req.userId;

  if (pool) {
    try {
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
  const account = accounts.find((a) => a.userId === userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  account.amount += validAmount;
  transactions.push({
    id: transactions.length + 1,
    userId,
    accountId: account.id,
    amount: validAmount,
    type: "deposit",
    createdAt: new Date().toISOString(),
  });
  res.status(200).json({ amount: account.amount });
});

// Ta ut pengar (VG: övertrasseringsskydd)
app.post("/me/accounts/withdrawals", requireAuth, async (req, res) => {
  const { amount } = req.body;

  const check = validateAmount(amount);
  if (!check.ok) {
    return res.status(400).json({ error: check.error });
  }
  const validAmount = check.amount;
  const userId = req.userId;

  if (pool) {
    try {
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
  const account = accounts.find((a) => a.userId === userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  if (!canWithdraw(account.amount, validAmount)) {
    return res.status(400).json({ error: "Insufficient funds" });
  }
  account.amount -= validAmount;
  transactions.push({
    id: transactions.length + 1,
    userId,
    accountId: account.id,
    amount: validAmount,
    type: "withdrawal",
    createdAt: new Date().toISOString(),
  });
  res.status(200).json({ amount: account.amount });
});

// Hämta transaktionshistorik, nyast först (401 utan/fel token)
app.post("/me/transactions", requireAuth, async (req, res) => {
  const userId = req.userId;

  if (pool) {
    try {
      const history = await pool.query(
        'SELECT id, amount, type, "createdAt" FROM transactions WHERE "userId" = $1 ORDER BY "createdAt" DESC, id DESC',
        [userId],
      );
      return res.status(200).json({ transactions: history.rows });
    } catch (err) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // In-memory fallback
  const history = transactions
    .filter((t) => t.userId === userId)
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
const transactions = [];

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
  console.log(
    pool ? "Databas: PostgreSQL" : "Databas: In-memory (ingen DATABASE_URL)",
  );
});
