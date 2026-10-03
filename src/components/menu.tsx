import {
  AccountBookOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  InboxOutlined,
  LockOutlined,
  PieChartOutlined,
  SendOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

export interface ItemMenu {
  ke: string;
  label: string;
  ikon: ReactNode;
}

export interface GrupMenu {
  grup: string;
  item: ItemMenu[];
}

/**
 * Menu admin/owner dikelompokkan sesuai spesifikasi Bagian 5.1. URL lama tetap (bookmark & PWA aman);
 * yang berubah hanya pengelompokan dan nama. Halaman baru Fase 2 (Kas iklan, Neraca, HPP, Tutup buku, …)
 * belum ada, jadi belum masuk menu.
 */
export const MENU_PEMILIK: GrupMenu[] = [
  {
    grup: "Mingguan",
    item: [
      { ke: "/", label: "Beranda", ikon: <HomeOutlined /> },
      { ke: "/selasa", label: "Tutup Kas Mingguan", ikon: <CalendarOutlined /> },
    ],
  },
  {
    grup: "Penjualan",
    item: [
      { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
      { ke: "/penjual-lain", label: "Tagihan penjual lain", ikon: <ShopOutlined /> },
    ],
  },
  { grup: "Pembelian", item: [{ ke: "/pesanan-tukang", label: "Bayar tukang & supplier", ikon: <ToolOutlined /> }] },
  {
    grup: "Uang",
    item: [
      { ke: "/keuangan", label: "Kas & transaksi", ikon: <WalletOutlined /> },
      { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
      { ke: "/gaji", label: "Gaji & tagihan rutin", ikon: <TeamOutlined /> },
      { ke: "/bagi-hasil", label: "Bagi hasil", ikon: <PieChartOutlined /> },
    ],
  },
  {
    grup: "Laporan",
    item: [
      { ke: "/laporan", label: "Laba rugi", ikon: <BarChartOutlined /> },
      { ke: "/laporan/kas-kecil", label: "Kas kecil", ikon: <FileTextOutlined /> },
      { ke: "/kiriman", label: "Kirim ke laporan keuangan", ikon: <SendOutlined /> },
      { ke: "/laporan/tutup-buku", label: "Tutup buku", ikon: <LockOutlined /> },
    ],
  },
  {
    grup: "Pengaturan",
    item: [
      { ke: "/master", label: "Data master", ikon: <DatabaseOutlined /> },
      { ke: "/akun", label: "Profil saya", ikon: <UserOutlined /> },
    ],
  },
];

/** Navigasi bawah (HP) admin/owner; sisanya lewat halaman "Lainnya". */
export const MENU_BAWAH_PEMILIK: ItemMenu[] = [
  { ke: "/", label: "Beranda", ikon: <HomeOutlined /> },
  { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
  { ke: "/selasa", label: "Tutup kas", ikon: <CalendarOutlined /> },
  { ke: "/keuangan", label: "Kas", ikon: <WalletOutlined /> },
  { ke: "/lainnya", label: "Lainnya", ikon: <AppstoreOutlined /> },
];

/** Menu staf (Bagian 5.2): hanya tiga. */
export const MENU_STAF: ItemMenu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
  { ke: "/laporan/kas-kecil", label: "Riwayat bulan ini", ikon: <HistoryOutlined /> },
  { ke: "/akun", label: "Profil saya", ikon: <UserOutlined /> },
];

/** Grup menu untuk halaman "Lainnya" di HP: tanpa item yang sudah ada di navigasi bawah. */
export const MENU_LAINNYA: GrupMenu[] = MENU_PEMILIK.map((g) => ({
  grup: g.grup,
  item: g.item.filter((m) => !MENU_BAWAH_PEMILIK.some((b) => b.ke === m.ke)),
})).filter((g) => g.item.length > 0);

export const semuaItem = (grup: GrupMenu[]): ItemMenu[] => grup.flatMap((g) => g.item);

/** Menu terpilih: cocokkan awalan path terpanjang (mis. /laporan/kas-kecil tidak ikut menyorot /laporan). */
export function kunciAktif(menu: { ke: string }[], path: string): string[] {
  const cocok = menu.filter((m) => (m.ke === "/" ? path === "/" : path === m.ke || path.startsWith(m.ke + "/")));
  cocok.sort((a, b) => b.ke.length - a.ke.length);
  return cocok.length ? [cocok[0].ke] : [];
}
