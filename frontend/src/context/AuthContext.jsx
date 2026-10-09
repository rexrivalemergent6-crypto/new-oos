import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { connectPhantom, disconnectPhantom, signMessagePhantom, getPhantom } from "@/lib/phantom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("qpos_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setMerchant(data);
    } catch (e) {
      localStorage.removeItem("qpos_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback(async () => {
    setConnecting(true);
    try {
      const address = await connectPhantom();
      const { data: ch } = await api.post("/auth/challenge", { address });
      const signature = await signMessagePhantom(ch.message);
      const { data } = await api.post("/auth/verify", { address, message: ch.message, signature });
      localStorage.setItem("qpos_token", data.token);
      setMerchant(data.merchant);
      return data.merchant;
    } finally {
      setConnecting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await disconnectPhantom();
    localStorage.removeItem("qpos_token");
    setMerchant(null);
  }, []);

  const refreshMerchant = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setMerchant(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ merchant, setMerchant, loading, connecting, login, logout, refreshMerchant, hasPhantom: !!getPhantom() }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
