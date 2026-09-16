import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// auth-aware navbar. reads persisted login (token + username) from
// localStorage on mount. Logins survive page reloads and the
// navbar reflects the session on every page.
export default function Navbar() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setUsername(token ? window.localStorage.getItem("username") : null);
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <nav>
      <Link href="/">Home</Link>
      {username ? (
        <>
          <span className="nav-user">{username}</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <Link href="/register">Create account</Link>
        </>
      )}
      <ThemeToggle />
    </nav>
  );
}
