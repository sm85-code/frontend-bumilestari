import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { isPemilik, useAuth } from "../../../auth/AuthContext";
import { Button, ErrorMessage } from "./UI";

export default function Layout() {
  const { user, keluar } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menus = isPemilik(user?.role) ? [["/", "Dashboard"], ["/order", "Order"], ["/produksi", "Produksi"], ["/keuangan", "Keuangan"], ["/piutang", "Piutang"], ["/persediaan", "Persediaan"], ["/impor", "Import"], ["/sinkronisasi", "Sinkronisasi"], ["/pengaturan", "Pengaturan"], ["/akun", "Profil"]] : [["/kas-kecil", "Kas kecil"], ["/akun", "Profil"]];
  async function logout() { setBusy(true); setError(null); try { await keluar(); } catch (e) { setError(e); } finally { setBusy(false); } }
  return <div className="min-h-screen bg-stone-50 text-stone-800"><header className="border-b bg-white px-4 py-4"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-emerald-900">Bumi Lestari</p><p className="text-xs text-stone-500">{user?.nama} · {user?.role}</p></div><Button variant="outline" disabled={busy} onClick={() => void logout()}>{busy ? "Keluar…" : "Keluar"}</Button></div><ErrorMessage error={error} /></header>
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[190px_1fr]"><div><Button variant="outline" className="w-full lg:hidden" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>Menu</Button><nav id="main-navigation" aria-label="Navigasi utama" className={`${menuOpen ? "flex" : "hidden"} mt-3 flex-col gap-2 lg:mt-0 lg:flex`}>{menus.map(([to, label]) => <NavLink end={to === "/"} key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `min-h-11 rounded-lg px-4 py-3 text-sm ${isActive ? "bg-emerald-800 text-white" : "bg-white text-stone-700 hover:bg-emerald-50"}`}>{label}</NavLink>)}</nav></div><main className="min-w-0 py-2"><Outlet /></main></div></div>;
}
