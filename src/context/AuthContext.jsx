import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("labbook_current_user")) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem("labbook_current_user", JSON.stringify(user));
    else localStorage.removeItem("labbook_current_user");
  }, [user]);

  async function login(credentials) {
    const result = await api.login(credentials);
    if (result.token) localStorage.setItem("labbook_token", result.token);
    setUser(result.user || result);
    return result;
  }
  async function register(details) {
    const result = await api.register(details);
    if (result.token) localStorage.setItem("labbook_token", result.token);
    setUser(result.user || result);
    return result;
  }
  function logout() {
    localStorage.removeItem("labbook_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
