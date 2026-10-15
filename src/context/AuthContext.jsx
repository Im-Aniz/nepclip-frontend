import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { get, post, tokens } from "../services/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (role) => ({ creator: "/creator", brand: "/brand", admin: "/admin" }[role] || "/");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokens.access);

  const loadMe = useCallback(async () => {
    try { setUser(await get("/auth/me/")); } catch { tokens.clear(); setUser(null); } finally { setReady(true); }
  }, []);

  useEffect(() => { if (tokens.access) loadMe(); }, [loadMe]);
  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener("nc-logout", out);
    return () => window.removeEventListener("nc-logout", out);
  }, []);

  const value = useMemo(() => ({
    user, ready, refresh: loadMe,
    async login(email, password) {
      const { data } = await api.post("/auth/login/", { email, password });
      tokens.set(data); setUser(data.user); return data.user;
    },
    async google(credential) {
      const { data } = await api.post("/auth/google/", { credential });
      tokens.set(data); setUser(data.user); return data.user;
    },
    async register(kind, payload) {
      await post(`/auth/register/${kind}/`, payload);
      const g = (k) => (payload instanceof FormData ? payload.get(k) : payload[k]);
      return this.login(g("email"), g("password"));
    },
    async logout() {
      try { if (tokens.refresh) await post("/auth/logout/", { refresh: tokens.refresh }); } catch { /* token already invalid */ }
      tokens.clear(); setUser(null);
    },
  }), [user, ready, loadMe]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
