import {
  AccountBookOutlined,
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
} from "@ant-design/icons";
import { Button, Flex, Menu, Typography } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { WARNA } from "../theme";

interface ItemMenu {
  ke: string;
  label: string;
  ikon: ReactNode;
  admin?: boolean;
}

/** Menu utama pemilik: tampil di navigasi bawah (HP). Sisanya lewat halaman "Lainnya". */
const MENU_UTAMA: ItemMenu[] = [
  { ke: "/", label: "Beranda", ikon: <HomeOutlined /> },
  { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
  { ke: "/selasa", label: "Selasa", ikon: <CalendarOutlined /> },
  { ke: "/keuangan", label: "Keuangan", ikon: <WalletOutlined /> },
  { ke: "/lainnya", label: "Lainnya", ikon: <AppstoreOutlined /> },
];

/** Semua menu pemilik (menu samping di laptop dan halaman Lainnya). */
const MENU_PEMILIK: ItemMenu[] = [
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
export const MENU_LAINNYA: ItemMenu[] = MENU_PEMILIK.filter((m) => !MENU_UTAMA.some((u) => u.ke === m.ke));

const MENU_STAF: ItemMenu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
  { ke: "/laporan/kas-kecil", label: "Laporan", ikon: <BarChartOutlined /> },
  { ke: "/akun", label: "Akun", ikon: <UserOutlined /> },
];

/** Menu terpilih: cocokkan awalan path terpanjang (mis. /laporan/kas-kecil tidak ikut menyorot /laporan). */
function kunciAktif(menu: ItemMenu[], path: string): string[] {
  const cocok = menu.filter((m) => (m.ke === "/" ? path === "/" : path === m.ke || path.startsWith(m.ke + "/")));
  cocok.sort((a, b) => b.ke.length - a.ke.length);
  return cocok.length ? [cocok[0].ke] : [];
}

/** true bila lebar layar >= 768px (laptop/tablet). Nilai awal langsung benar agar tidak berkedip. */
function useLaptop(): boolean {
  const q = "(min-width: 768px)";
  const [ya, setYa] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setYa(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return ya;
}

function Merek({ nama, peran, ukuran }: { nama?: string; peran?: string; ukuran: number }) {
  return (
    <Flex align="center" gap={12} style={{ minWidth: 0 }}>
      <img src="/logo.png" alt="" width={ukuran} height={ukuran} />
      <div style={{ minWidth: 0 }}>
        <Typography.Text strong ellipsis style={{ display: "block", fontSize: 16, color: WARNA.hijau }}>
          Bumi Lestari
        </Typography.Text>
        <Typography.Text type="secondary" ellipsis style={{ display: "block", fontSize: 12 }}>
          {nama} · {peran}
        </Typography.Text>
      </div>
    </Flex>
  );
}

/**
 * Laptop (>= 768px): sidebar putih melayang + konten.
 * HP: header kapsul di atas dan navigasi bawah melayang.
 */
export default function Layout() {
  const { user, keluar } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const laptop = useLaptop();
  const pemilik = isPemilik(user?.role);
  const menu = pemilik ? MENU_PEMILIK : MENU_STAF; // menu samping (laptop)
  const menuBawah = pemilik ? MENU_UTAMA : MENU_STAF; // navigasi bawah (HP)
  const aktif = kunciAktif(menu, pathname);
  const aktifBawah = kunciAktif(menuBawah, pathname);

  if (laptop) {
    return (
      <div style={{ minHeight: "100vh", background: WARNA.latar, padding: 16, display: "flex", gap: 20, alignItems: "flex-start" }}>
        <aside
          aria-label="Menu samping"
          style={{
            width: 252,
            flex: "0 0 252px",
            position: "sticky",
            top: 16,
            height: "calc(100vh - 32px)",
            background: WARNA.kartu,
            borderRadius: 28,
            boxShadow: "0 1px 2px rgba(20,24,28,0.03), 0 8px 28px rgba(20,24,28,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "22px 20px 12px" }}>
            <Merek nama={user?.nama} peran={user?.role} ukuran={46} />
          </div>
          <Menu
            mode="inline"
            style={{ flex: 1, borderInlineEnd: 0, padding: "4px 12px", overflowY: "auto", background: "transparent" }}
            selectedKeys={aktif}
            onClick={({ key }) => navigate(key)}
            items={menu.map((m) => ({ key: m.ke, icon: m.ikon, label: m.label }))}
          />
          <div style={{ padding: 16 }}>
            <Button block icon={<LogoutOutlined />} onClick={() => void keluar()}>
              Keluar
            </Button>
          </div>
        </aside>
        <main style={{ flex: 1, minWidth: 0 }}>
          <Flex vertical gap={20} style={{ maxWidth: 1360, margin: "0 auto", padding: "8px 8px 24px" }}>
            <Outlet />
          </Flex>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: WARNA.latar }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "10px 12px 6px",
          paddingTop: "max(10px, env(safe-area-inset-top))",
          background: `linear-gradient(${WARNA.latar} 70%, transparent)`,
        }}
      >
        <div style={{ background: WARNA.kartu, borderRadius: 999, padding: "8px 16px", boxShadow: "0 1px 2px rgba(20,24,28,0.04), 0 6px 20px rgba(20,24,28,0.05)" }}>
          <Merek nama={user?.nama} peran={user?.role} ukuran={38} />
        </div>
      </header>
      <main style={{ padding: "8px 12px 104px" }}>
        <Flex vertical gap={16}>
          <Outlet />
        </Flex>
      </main>
      <nav
        aria-label="Navigasi utama"
        style={{ position: "fixed", insetInline: 12, bottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 20, background: WARNA.kartu, borderRadius: 28, padding: 6, boxShadow: "0 4px 24px rgba(20,24,28,0.12)" }}
      >
        <Flex>
          {menuBawah.map((m) => {
            const on = aktifBawah.includes(m.ke);
            return (
              <Button
                key={m.ke}
                type="text"
                onClick={() => navigate(m.ke)}
                aria-current={on ? "page" : undefined}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: 4,
                  fontSize: 11,
                  fontWeight: on ? 700 : 500,
                  background: on ? WARNA.hijauMuda : "transparent",
                  color: on ? WARNA.hijau : WARNA.redup,
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{m.ikon}</span>
                {m.label}
              </Button>
            );
          })}
        </Flex>
      </nav>
    </div>
  );
}
