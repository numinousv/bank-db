import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

  useEffect(() => {
    let cancelled = false;

    fetch(`${apiUrl}/me/transactions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          if (cancelled) return;
          setItems(data.transactions || []);
        } else {
          router.push("/login");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMessage("Could not fetch transactions");
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, router]);

  return (
    <>
      <Head>
        <title>Transactions - Bank</title>
      </Head>
      <Navbar />
      <main>
        <h1>Transaction history</h1>
        {message && <div className="message error">{message}</div>}
        <p>
          <Link href="/account">Back to account</Link>
        </p>
        {items.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <ul>
            {items.map((t) => (
              <li key={t.id} data-testid="transaction-item">
                <span>{t.type === "withdrawal" ? "Withdrawal" : "Deposit"}</span>
                : <span>{t.amount} kr</span> -{" "}
                <time dateTime={t.createdAt}>
                  {new Date(t.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
