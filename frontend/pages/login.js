import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";

export default function Login() {
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
      const response = await fetch(`${apiUrl}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", username);
        router.push("/account");
      } else {
        const data = await response.json();
        setMessage(data.error || "Wrong username or password");
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
        <title>Login - Bank</title>
      </Head>
      <Navbar />
      <main>
        <h1>Login</h1>
        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </main>
    </>
  );
}
