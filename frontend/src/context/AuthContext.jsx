import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("studysync_token");
    if (token) {
      auth
        .me()
        .then(setUser)
        .catch(() => localStorage.removeItem("studysync_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { access_token } = await auth.login({ email, password });
    localStorage.setItem("studysync_token", access_token);
    const me = await auth.me();
    setUser(me);
    return me;
  };

  const register = async (email, username, password) => {
    const { access_token } = await auth.register({ email, username, password });
    localStorage.setItem("studysync_token", access_token);
    const me = await auth.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem("studysync_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
