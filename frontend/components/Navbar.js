import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

// auth-aware navbar. reads persisted login (token + username) from
// localStorage on mount. Logins survive page reloads and the
// navbar reflects the session on every page.
// Read lazily in useState (instead of a mount effect) so there is no
// extra setState-render cycle: each page renders its own Navbar, so a
// fresh mount picks up the latest session after login/logout navs.
function readSessionUsername() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token")
    ? window.localStorage.getItem("username")
    : null;
}

export default function Navbar() {
  const [username] = useState(readSessionUsername);

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("username");
    // Full reload on purpose: it drops all in-memory auth state and works
    // without a Next router context (Navbar is also rendered in Jest tests).
    window.location.href = "/";
  };

  return (
    <nav>
      <Link href="/">Home</Link>
      {username ? (
        <>
          <Link className="nav-user" href="/account">
            {username}
          </Link>
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
