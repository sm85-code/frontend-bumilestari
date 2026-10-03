import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { Role, User } from "../lib/types";

interface AuthState {
  user: User | null;
  memuat: boolean;
  masuk: (email: string, password: string) => Promise<User>;
  keluar: () => Promise<void>;
  perbarui: (user: User) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch((e: unknown) => {
        if (!(e instanceof ApiError) || e.status !== 401) console.error(e);
        setUser(null);
      })
      .finally(() => setMemuat(false));
  }, []);

  const masuk = useCallback(async (email: string, password: string) => {
    const u = await api<User>("/auth/login", { body: { email, password } });
    setUser(u);
    return u;
  }, []);

  const keluar = useCallback(async () => {
    await api("/auth/logout", { method: "POST", body: {} }).catch(() => undefined);
    setUser(null);
  }, []);

  const nilai = useMemo(() => ({ user, memuat, masuk, keluar, perbarui: setUser }), [user, memuat, masuk, keluar]);
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth harus di dalam AuthProvider");
  return c;
}

export const isPemilik = (role: Role | undefined) => role === "admin" || role === "owner";
