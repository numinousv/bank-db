import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Account() {
  const [amount, setAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

  const fetchBalance = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/me/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setAmount(data.amount);
      } else {
        router.push("/login");
      }
    } catch (error) {
      setMessage("Kunde inte hämta saldo");
      setIsError(true);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/me/accounts/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount: Number(depositAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        setAmount(data.amount);
        setDepositAmount("");
      } else {
        setMessage("Något gick fel vid insättning");
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
        <title>Konto - Banken</title>
      </Head>
      <nav>
        <Link href="/">Hem</Link>
        <Link href="/login">Logga in</Link>
        <Link href="/register">Skapa användare</Link>
      </nav>
      <main>
        <h1>Ditt konto</h1>
        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
        <div className="card">
          <p>
            Saldo: <span className="balance">{amount} kr</span>
          </p>
          <form onSubmit={handleDeposit}>
            <div>
              <label htmlFor="amount">Belopp</label>
              <input
                id="amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit">Sätt in</button>
          </form>
        </div>
      </main>
    </>
  );
}
