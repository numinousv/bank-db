import { createContext, useContext, useEffect, useState } from "react";

// Short-lived login state only. The JWT itself lives in an HttpOnly
// cookie that the browser sends automatically, so React state never
// holds anything sensitive and nothing is persisted to localStorage.
// On every full page load the session is rehydrated from the cookie,
// so closing and reopening a tab keeps the user logged in.
const AuthContext = createContext({ user: null, setUser: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
    fetch(`${apiUrl}/me/accounts`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (cancelled || !response.ok) return;
        const data = await response.json().catch(() => null);
        if (cancelled || !data || !data.username) return;
        setUser(data.username);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
