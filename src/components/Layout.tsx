import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  PieChartOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  WalletOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import Wallpaper from "./Wallpaper";

interface Menu {
  ke: string;
  label: string;
  ikon: ReactNode;
  admin?: boolean;
}

/** Menu utama pemilik: tampil di navigasi bawah (HP). Sisanya lewat halaman "Lainnya". */
const MENU_UTAMA: Menu[] = [
  { ke: "/", label: "Beranda", ikon: <HomeOutlined /> },
  { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
  { ke: "/selasa", label: "Selasa", ikon: <CalendarOutlined /> },
  { ke: "/keuangan", label: "Keuangan", ikon: <WalletOutlined /> },
  { ke: "/lainnya", label: "Lainnya", ikon: <AppstoreOutlined /> },
];

/** Semua menu pemilik (menu samping di laptop dan halaman Lainnya). */
const MENU_PEMILIK: Menu[] = [
  { ke: "/", label: "Beranda", ikon: <HomeOutlined /> },
  { ke: "/selasa", label: "Selasa", ikon: <CalendarOutlined /> },
  { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
  { ke: "/pesanan-tukang", label: "Pesanan ke tukang", ikon: <ToolOutlined /> },
  { ke: "/penjual-lain", label: "Penjual lain", ikon: <ShopOutlined /> },
  { ke: "/keuangan", label: "Keuangan", ikon: <WalletOutlined /> },
  { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
  { ke: "/gaji", label: "Gaji & langganan", ikon: <TeamOutlined /> },
  { ke: "/bagi-hasil", label: "Bagi hasil", ikon: <PieChartOutlined /> },
  { ke: "/laporan", label: "Laporan", ikon: <BarChartOutlined /> },
  { ke: "/master", label: "Master data", ikon: <DatabaseOutlined /> },
  { ke: "/akun", label: "Akun", ikon: <UserOutlined /> },
];

/** Isi halaman "Lainnya" (menu yang tidak ada di navigasi bawah). */
export const MENU_LAINNYA: Menu[] = MENU_PEMILIK.filter((m) => !MENU_UTAMA.some((u) => u.ke === m.ke));

const MENU_STAF: Menu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
  { ke: "/laporan/kas-kecil", label: "Laporan", ikon: <BarChartOutlined /> },
  { ke: "/akun", label: "Akun", ikon: <UserOutlined /> },
];

/** Menu terpilih: cocokkan awalan path terpanjang (mis. /laporan/kas-kecil tidak ikut menyorot /laporan). */
function kunciAktif(menu: Menu[], path: string): string[] {
  const cocok = menu.filter((m) => (m.ke === "/" ? path === "/" : path === m.ke || path.startsWith(m.ke + "/")));
  cocok.sort((a, b) => b.ke.length - a.ke.length);
  return cocok.length ? [cocok[0].ke] : [];
}

/**
 * Laptop (md ke atas): menu samping tetap + area konten lebar.
 * HP: header + navigasi bawah.
 */
export default function Layout() {
  const { user, keluar } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pemilik = isPemilik(user?.role);
  const menu = pemilik ? MENU_PEMILIK : MENU_STAF; // menu samping (laptop)
  const menuBawah = pemilik ? MENU_UTAMA : MENU_STAF; // navigasi bawah (HP)
  const aktif = kunciAktif(menu, pathname);
  const aktifBawah = kunciAktif(menuBawah, pathname);
  return (
    <div className="relative min-h-full md:flex">
      <Wallpaper />
      <aside className="z-10 hidden border-r border-garis bg-white md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col" aria-label="Menu samping">
        <div className="flex items-center gap-3 border-b border-garis px-5 py-4">
          <img src="/logo.png" alt="" className="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold leading-tight text-hijau">Bumi Lestari</p>
            <p className="truncate text-xs text-coklat">
              {user?.nama} · {user?.role}
            </p>
          </div>
        </div>
        <Menu
          mode="inline"
          className="flex-1 overflow-y-auto !border-0 p-2"
          selectedKeys={aktif}
          onClick={({ key }) => navigate(key)}
          items={menu.map((m) => ({ key: m.ke, icon: m.ikon, label: m.label }))}
        />
        <div className="border-t border-garis p-3">
          <Button block icon={<LogoutOutlined />} onClick={() => void keluar()}>
            Keluar
          </Button>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-full flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-garis bg-white/90 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
          <img src="/logo.png" alt="" className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-tight text-hijau">Bumi Lestari</p>
            <p className="truncate text-xs text-coklat">
              {user?.nama} · {user?.role}
            </p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 pb-28 md:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-garis bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navigasi utama"
      >
        <ul className="flex">
          {menuBawah.map((m) => {
            const on = aktifBawah.includes(m.ke);
            return (
              <li key={m.ke} className="flex-1">
                <NavLink
                  to={m.ke}
                  end={m.ke === "/"}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "font-bold text-hijau" : "text-coklat"}`}
                >
                  <span aria-hidden className="text-xl leading-none">
                    {m.ikon}
                  </span>
                  {m.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
