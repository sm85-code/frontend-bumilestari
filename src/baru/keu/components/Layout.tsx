import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { isPemilik, useAuth } from "../../../auth/AuthContext";
import { Button, ErrorMessage } from "./UI";

export default function Layout() {
  const { user, keluar } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const menus = isPemilik(user?.role) ? [["/", "Dashboard"], ["/order", "Order"], ["/produksi", "Produksi"], ["/keuangan", "Keuangan"], ["/piutang", "Piutang"], ["/persediaan", "Persediaan"], ["/laporan-keuangan", "Laporan Keuangan"], ["/impor", "Import"], ["/sinkronisasi", "Sinkronisasi"], ["/pengaturan", "Pengaturan"], ["/akun", "Profil"]] : [["/kas-kecil", "Kas kecil"], ["/akun", "Profil"]];
  async function logout() { setBusy(true); setError(null); try { await keluar(); } catch (e) { setError(e); } finally { setBusy(false); } }
  return <div className="min-h-screen bg-stone-50 text-stone-800"><header className="border-b bg-white px-4 py-4"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-emerald-900">Bumi Lestari</p><p className="text-xs text-stone-500">{user?.nama} · {user?.role}</p></div><Button disabled={busy} onClick={() => void logout()}>{busy ? "Keluar…" : "Keluar"}</Button></div><ErrorMessage error={error} /></header>
    <div className="mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-[190px_1fr]"><nav aria-label="Navigasi utama" className="flex flex-wrap gap-2 md:flex-col">{menus.map(([to, label]) => <NavLink end={to === "/"} key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? "bg-emerald-800 text-white" : "bg-white text-stone-700 hover:bg-emerald-50"}`}>{label}</NavLink>)}</nav><main className="min-w-0 py-2"><Outlet /></main></div></div>;
}
