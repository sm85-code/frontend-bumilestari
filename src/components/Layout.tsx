import { NavLink, Outlet } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";

interface Menu {
  ke: string;
  label: string;
  ikon: string;
}

const MENU_PEMILIK: Menu[] = [
  { ke: "/", label: "Beranda", ikon: "🏠" },
  { ke: "/keuangan", label: "Keuangan", ikon: "💰" },
  { ke: "/kas-kecil", label: "Kas kecil", ikon: "👛" },
  { ke: "/laporan", label: "Laporan", ikon: "📊" },
  { ke: "/akun", label: "Akun", ikon: "👤" },
];
const MENU_STAF: Menu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: "👛" },
  { ke: "/laporan/kas-kecil", label: "Laporan", ikon: "📊" },
  { ke: "/akun", label: "Akun", ikon: "👤" },
];

export default function Layout() {
  const { user } = useAuth();
  const menu = isPemilik(user?.role) ? MENU_PEMILIK : MENU_STAF;
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-hijau px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg bg-white p-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">Bumi Lestari</p>
          <p className="truncate text-xs text-white/80">
            {user?.nama} · {user?.role}
          </p>
        </div>
      </header>
      <main className="flex-1 space-y-3 p-4 pb-28">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-garis bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigasi utama"
      >
        <ul className="mx-auto flex max-w-3xl">
          {menu.map((m) => (
            <li key={m.ke} className="flex-1">
              <NavLink
                to={m.ke}
                end={m.ke === "/"}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${isActive ? "font-bold text-hijau" : "text-stone-500"}`
                }
              >
                <span aria-hidden className="text-lg leading-none">
                  {m.ikon}
                </span>
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
