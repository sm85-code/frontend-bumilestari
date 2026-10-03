import { NavLink, Outlet } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";

interface Menu {
  ke: string;
  label: string;
  ikon: string;
  admin?: boolean;
}

/** Menu utama pemilik: tampil di navigasi bawah (HP). Sisanya lewat halaman "Lainnya". */
const MENU_UTAMA: Menu[] = [
  { ke: "/", label: "Beranda", ikon: "🏠" },
  { ke: "/order", label: "Order", ikon: "📦" },
  { ke: "/selasa", label: "Selasa", ikon: "📅" },
  { ke: "/keuangan", label: "Keuangan", ikon: "💰" },
  { ke: "/lainnya", label: "Lainnya", ikon: "☰" },
];

/** Semua menu pemilik (menu samping di laptop dan halaman Lainnya). */
const MENU_PEMILIK: Menu[] = [
  { ke: "/", label: "Beranda", ikon: "🏠" },
  { ke: "/selasa", label: "Selasa", ikon: "📅" },
  { ke: "/order", label: "Order", ikon: "📦" },
  { ke: "/pesanan-tukang", label: "Pesanan ke tukang", ikon: "🪚" },
  { ke: "/penjual-lain", label: "Penjual lain", ikon: "🧾" },
  { ke: "/keuangan", label: "Keuangan", ikon: "💰" },
  { ke: "/kas-kecil", label: "Kas kecil", ikon: "👛" },
  { ke: "/gaji", label: "Gaji & langganan", ikon: "👥" },
  { ke: "/bagi-hasil", label: "Bagi hasil", ikon: "🤝" },
  { ke: "/laporan", label: "Laporan", ikon: "📊" },
  { ke: "/master", label: "Master data", ikon: "🗂️" },
  { ke: "/akun", label: "Akun", ikon: "👤" },
];

/** Isi halaman "Lainnya" (menu yang tidak ada di navigasi bawah). */
export const MENU_LAINNYA: Menu[] = MENU_PEMILIK.filter((m) => !MENU_UTAMA.some((u) => u.ke === m.ke));

const MENU_STAF: Menu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: "👛" },
  { ke: "/laporan/kas-kecil", label: "Laporan", ikon: "📊" },
  { ke: "/akun", label: "Akun", ikon: "👤" },
];

/**
 * Laptop (md ke atas): menu samping tetap + area konten lebar.
 * HP: header hijau + navigasi bawah.
 */
export default function Layout() {
  const { user, keluar } = useAuth();
  const pemilik = isPemilik(user?.role);
  const menu = pemilik ? MENU_PEMILIK : MENU_STAF; // menu samping (laptop)
  const menuBawah = pemilik ? MENU_UTAMA : MENU_STAF; // navigasi bawah (HP)
  return (
    <div className="min-h-full md:flex">
      <aside className="hidden border-r border-garis bg-white md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col" aria-label="Menu samping">
        <div className="flex items-center gap-3 bg-hijau px-4 py-4 text-white">
          <img src="/logo.png" alt="" className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">Bumi Lestari</p>
            <p className="truncate text-xs text-white/80">
              {user?.nama} · {user?.role}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menu.map((m) => (
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.ke === "/"}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${isActive ? "bg-hijau-muda font-bold text-hijau" : "text-stone-700 hover:bg-stone-100"}`
              }
            >
              <span aria-hidden>{m.ikon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => void keluar()} className="m-3 min-h-11 rounded-xl border border-garis text-sm font-semibold text-stone-700 hover:bg-stone-100">
          Keluar
        </button>
      </aside>

      <div className="flex min-h-full flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-10 flex items-center gap-3 bg-hijau px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white md:hidden">
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-lg bg-white p-0.5" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">Bumi Lestari</p>
            <p className="truncate text-xs text-white/80">
              {user?.nama} · {user?.role}
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 pb-28 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-garis bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navigasi utama"
      >
        <ul className="flex">
          {menuBawah.map((m) => (
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
