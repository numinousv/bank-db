import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
      const response = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setMessage("Användare skapad! Du kan nu logga in.");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const data = await response.json();
        setMessage(data.error || "Något gick fel");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Kunde inte ansluta till servern");
      setIsError(true);
    }
  };

  return (
    <>
      <Head>
        <title>Skapa användare - Banken</title>
      </Head>
      <nav>
        <Link href="/">Hem</Link>
        <Link href="/login">Logga in</Link>
        <Link href="/register">Skapa användare</Link>
      </nav>
      <main>
        <h1>Skapa användare</h1>
        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Användarnamn</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Lösenord</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Skapa användare</button>
          </form>
        </div>
      </main>
    </>
  );
}
