import { LogoutOutlined } from "@ant-design/icons";
import { Button, Flex, Menu, Typography } from "antd";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { labelPeran } from "../lib/format";
import { WARNA } from "../theme";
import { kunciAktif, MENU_BAWAH_PEMILIK, MENU_STAF, menuPemilik, semuaItem } from "./menu";

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
          {nama} · {labelPeran(peran)}
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
  const menuBawah = pemilik ? MENU_BAWAH_PEMILIK : MENU_STAF; // navigasi bawah (HP)
  const menu = menuPemilik(user?.role === "admin");
  const aktif = kunciAktif(pemilik ? semuaItem(menu) : MENU_STAF, pathname);
  // Halaman yang tidak ada di navigasi bawah (mis. /gaji) menyorot "Lainnya".
  const aktifBawah = kunciAktif(menuBawah, pathname).length ? kunciAktif(menuBawah, pathname) : pemilik ? ["/lainnya"] : [];
  // Menu samping: admin/owner dikelompokkan (Mingguan, Penjualan, Pembelian, Uang, Laporan, Pengaturan); staf 3 menu.
  const itemSamping = pemilik
    ? menu.map((g) => ({
        type: "group" as const,
        key: `grup-${g.grup}`,
        label: g.grup,
        children: g.item.map((m) => ({ key: m.ke, icon: m.ikon, label: m.label })),
      }))
    : MENU_STAF.map((m) => ({ key: m.ke, icon: m.ikon, label: m.label }));

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
            items={itemSamping}
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
          background: WARNA.latar,
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
                  fontSize: 12,
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
