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
import { Button, Flex, Layout as ALayout, Menu, Typography, theme } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";

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
    <Flex align="center" gap="small" style={{ minWidth: 0 }}>
      <img src="/logo.png" alt="" width={ukuran} height={ukuran} />
      <div style={{ minWidth: 0 }}>
        <Typography.Text strong type="success" ellipsis style={{ display: "block" }}>
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
 * Laptop (>= 768px): Sider (menu samping) + konten.
 * HP: header + navigasi bawah.
 */
export default function Layout() {
  const { user, keluar } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const laptop = useLaptop();
  const pemilik = isPemilik(user?.role);
  const menu = pemilik ? MENU_PEMILIK : MENU_STAF; // menu samping (laptop)
  const menuBawah = pemilik ? MENU_UTAMA : MENU_STAF; // navigasi bawah (HP)
  const aktif = kunciAktif(menu, pathname);
  const aktifBawah = kunciAktif(menuBawah, pathname);

  return (
    <ALayout style={{ minHeight: "100vh" }}>
      {laptop && (
        <ALayout.Sider width={248} theme="light" style={{ position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
          <Flex vertical style={{ height: "100%" }}>
            <div style={{ padding: 16 }}>
              <Merek nama={user?.nama} peran={user?.role} ukuran={44} />
            </div>
            <Menu
              mode="inline"
              style={{ flex: 1, borderInlineEnd: 0 }}
              selectedKeys={aktif}
              onClick={({ key }) => navigate(key)}
              items={menu.map((m) => ({ key: m.ke, icon: m.ikon, label: m.label }))}
            />
            <div style={{ padding: 16 }}>
              <Button block icon={<LogoutOutlined />} onClick={() => void keluar()}>
                Keluar
              </Button>
            </div>
          </Flex>
        </ALayout.Sider>
      )}

      <ALayout>
        {!laptop && (
          <ALayout.Header style={{ position: "sticky", top: 0, zIndex: 20, paddingInline: 16, height: "auto", lineHeight: "normal", paddingBlock: 8, background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
            <Merek nama={user?.nama} peran={user?.role} ukuran={40} />
          </ALayout.Header>
        )}
        <ALayout.Content style={{ padding: laptop ? 24 : 12, paddingBottom: laptop ? 24 : 84 }}>
          <Flex vertical gap="middle" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Outlet />
          </Flex>
        </ALayout.Content>
      </ALayout>

      {!laptop && (
        <nav
          aria-label="Navigasi utama"
          style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 20, background: token.colorBgContainer, borderTop: `1px solid ${token.colorBorderSecondary}`, paddingBottom: "env(safe-area-inset-bottom)" }}
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
                  style={{ flex: 1, height: 56, display: "flex", flexDirection: "column", gap: 2, padding: 4, color: on ? token.colorPrimary : token.colorTextSecondary, fontWeight: on ? 600 : 400, fontSize: 12 }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{m.ikon}</span>
                  {m.label}
                </Button>
              );
            })}
          </Flex>
        </nav>
      )}
    </ALayout>
  );
}
