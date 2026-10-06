-- database tables
-- executed automatically by the Postgres image on first startup
-- (mounted to /docker-entrypoint-initdb.d).
-- the table is also created by the backend's server.js (CREATE TABLE IF NOT EXISTS),
-- so this serves as a 'better safe than sorry' approach and schema documentation.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id),
  amount INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id),
  "accountId" INTEGER REFERENCES accounts(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
