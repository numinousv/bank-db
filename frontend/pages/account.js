import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";

export default function Account() {
  const [amount, setAmount] = useState(0);
  const [username, setUsername] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

  // Fetch-on-mount written as a subscription-style effect: state is only
  // ever updated inside the fetch callbacks (external change), never
  // synchronously in the effect body. The cancelled flag guards against
  // setting state after unmount.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    fetch(`${apiUrl}/me/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          setUsername(localStorage.getItem("username") || "");
          setAmount(data.amount);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMessage("Could not fetch balance");
        setIsError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, router]);

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
        const data = await response.json().catch(() => ({}));
        setMessage(data.error || "Something went wrong with the deposit");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setIsError(true);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/me/accounts/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount: Number(withdrawAmount) }),
      });

      if (response.ok) {
        const data = await response.json();
        setAmount(data.amount);
        setWithdrawAmount("");
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error || "Something went wrong with the withdrawal");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setIsError(true);
    }
  };

  return (
    <>
      <Head>
        <title>Account - Bank</title>
      </Head>
      <Navbar />
      <main>
        <h1>Your account{username ? `, ${username}` : ""}</h1>
        <p>
          <Link href="/transactions">Transaction history</Link>
        </p>
        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
        <div className="card">
          <p>
            Balance: <span className="balance">{amount} kr</span>
          </p>
          <form onSubmit={handleDeposit}>
            <div>
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit">Deposit</button>
          </form>
        </div>
        <div className="card">
          <form onSubmit={handleWithdraw}>
            <div>
              <label htmlFor="withdraw-amount">Withdraw amount</label>
              <input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit">Withdraw</button>
          </form>
        </div>
      </main>
    </>
  );
}
