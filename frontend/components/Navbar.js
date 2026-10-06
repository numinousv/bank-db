import Link from "next/link";
import { useRouter } from "next/router";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

// Auth-aware navbar. The logged-in user comes from React state (set at
// login, rehydrated from /me/accounts after reload). The JWT itself is
// never readable here: it lives in an HttpOnly cookie.
export default function Navbar() {
  const { user: username, setUser } = useAuth();
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // The cookie may already be gone; still clear local state below.
    }
    setUser(null);
    router.push("/login");
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
