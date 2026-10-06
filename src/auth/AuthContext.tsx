import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const client = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [memuat, setMemuat] = useState(true);

  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const started = generation.current;
    api<User>("/auth/me", { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted && started === generation.current) setUser(value); })
      .catch((e: unknown) => {
        if (controller.signal.aborted || started !== generation.current) return;
        if (!(e instanceof ApiError) || e.status !== 401) console.error(e);
        setUser(null);
      })
      .finally(() => { if (!controller.signal.aborted) setMemuat(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const expired = () => { generation.current++; client.clear(); setUser(null); setMemuat(false); };
    window.addEventListener("bumi-session-ended", expired);
    return () => window.removeEventListener("bumi-session-ended", expired);
  }, [client]);

  const masuk = useCallback(async (email: string, password: string) => {
    const u = await api<User>("/auth/login", { body: { email, password } });
    generation.current++;
    client.clear();
    setUser(u);
    return u;
  }, [client]);

  const keluar = useCallback(async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    generation.current++;
    client.clear();
    setUser(null);
  }, [client]);

  const nilai = useMemo(() => ({ user, memuat, masuk, keluar, perbarui: setUser }), [user, memuat, masuk, keluar]);
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth harus di dalam AuthProvider");
  return c;
}

export const isPemilik = (role: Role | undefined) => role === "admin" || role === "owner";
