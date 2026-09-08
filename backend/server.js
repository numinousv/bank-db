import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generera engångslösenord
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// Data arrays
const users = [];
const accounts = [];
const sessions = [];

// Skapa användare
app.post("/users", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const existing = users.find((u) => u.username === username);
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const userId = Date.now();
  users.push({ id: userId, username, password });
  accounts.push({ id: accounts.length + 1, userId, amount: 0 });

  res.status(201).json({ message: "User created" });
});

// Logga in
app.post("/sessions", (req, res) => {
  const { username, password } = req.body;
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
app.post("/me/accounts", (req, res) => {
  const { token } = req.body;
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

// Sätt in pengar
app.post("/me/accounts/transactions", (req, res) => {
  const { token, amount } = req.body;
  const session = sessions.find((s) => s.token === token);

  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const account = accounts.find((a) => a.userId === session.userId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  account.amount += Number(amount);
  res.status(200).json({ amount: account.amount });
});

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
