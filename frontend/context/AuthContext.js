import { createContext, useContext, useState } from "react";

// Short-lived login state only. The JWT itself lives in an HttpOnly
// cookie that the browser sends automatically, so React state never
// holds anything sensitive and nothing is persisted to localStorage.
const AuthContext = createContext({ user: null, setUser: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
