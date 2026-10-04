import {
  AccountBookOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  HomeOutlined,
  InboxOutlined,
  HourglassOutlined,
  LockOutlined,
  PieChartOutlined,
  SendOutlined,
  ShopOutlined,
  SoundOutlined,
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
  /** Hanya untuk admin (mis. Kas iklan). */
  admin?: boolean;
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
  { grup: "Dashboard", item: [{ ke: "/", label: "Dashboard", ikon: <HomeOutlined /> }, { ke: "/selasa", label: "Tutup kas Selasa", ikon: <CalendarOutlined /> }] },
  { grup: "Order", item: [{ ke: "/order", label: "Order", ikon: <InboxOutlined /> }, { ke: "/penjual-lain", label: "Order reseller", ikon: <ShopOutlined /> }, { ke: "/pencairan/erp", label: "Tarik dari ERP", ikon: <CloudDownloadOutlined /> }] },
  { grup: "Produksi", item: [{ ke: "/produksi", label: "Produksi", ikon: <ToolOutlined /> }, { ke: "/pesanan-tukang", label: "Tukang & supplier", ikon: <ToolOutlined /> }] },
  { grup: "Keuangan", item: [
      { ke: "/pencairan", label: "Pencairan", ikon: <CloudDownloadOutlined /> },
      { ke: "/keuangan", label: "Kas operasional", ikon: <WalletOutlined /> },
      { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
      { ke: "/kas-iklan", label: "Iklan", ikon: <SoundOutlined />, admin: true },
      { ke: "/gaji", label: "Gaji", ikon: <TeamOutlined /> },
      { ke: "/bagi-hasil", label: "Bagi hasil", ikon: <PieChartOutlined /> },
      { ke: "/laporan", label: "Laba rugi", ikon: <BarChartOutlined /> },
      { ke: "/laporan/belum-cair", label: "Belum cair", ikon: <HourglassOutlined /> },
      { ke: "/kiriman", label: "Kirim ke laporan", ikon: <SendOutlined /> },
      { ke: "/laporan/kas-kecil", label: "Riwayat kas kecil", ikon: <AccountBookOutlined /> },
    ] },
  { grup: "Pengaturan", item: [
      { ke: "/pengaturan", label: "Pengaturan", ikon: <AppstoreOutlined /> },
      { ke: "/master", label: "Katalog & saluran", ikon: <DatabaseOutlined /> },
      { ke: "/laporan/tutup-buku", label: "Tutup buku", ikon: <LockOutlined /> },
      { ke: "/akun", label: "Profil", ikon: <UserOutlined /> },
    ] },
];

/** Navigasi bawah (HP) admin/owner; sisanya lewat halaman "Lainnya". */
export const MENU_BAWAH_PEMILIK: ItemMenu[] = [
  { ke: "/", label: "Dashboard", ikon: <HomeOutlined /> },
  { ke: "/order", label: "Order", ikon: <InboxOutlined /> },
  { ke: "/produksi", label: "Produksi", ikon: <ToolOutlined /> },
  { ke: "/keuangan", label: "Keuangan", ikon: <WalletOutlined /> },
  { ke: "/pengaturan", label: "Pengaturan", ikon: <AppstoreOutlined /> },
];

/** Menu staf (Bagian 5.2): hanya tiga. */
export const MENU_STAF: ItemMenu[] = [
  { ke: "/kas-kecil", label: "Kas kecil", ikon: <AccountBookOutlined /> },
  { ke: "/laporan/kas-kecil", label: "Riwayat bulan ini", ikon: <HistoryOutlined /> },
  { ke: "/akun", label: "Profil saya", ikon: <UserOutlined /> },
];

/** Menu admin/owner sesuai peran: item `admin` hanya untuk admin. */
export const menuPemilik = (admin: boolean): GrupMenu[] => MENU_PEMILIK.map((g) => ({ grup: g.grup, item: g.item.filter((m) => admin || !m.admin) }));

/** Grup menu untuk halaman "Lainnya" di HP: tanpa item yang sudah ada di navigasi bawah. */
export const menuLainnya = (admin: boolean): GrupMenu[] =>
  menuPemilik(admin)
    .map((g) => ({ grup: g.grup, item: g.item.filter((m) => !MENU_BAWAH_PEMILIK.some((b) => b.ke === m.ke)) }))
    .filter((g) => g.item.length > 0);

export const semuaItem = (grup: GrupMenu[]): ItemMenu[] => grup.flatMap((g) => g.item);

/** Menu terpilih: cocokkan awalan path terpanjang (mis. /laporan/kas-kecil tidak ikut menyorot /laporan). */
export function kunciAktif(menu: { ke: string }[], path: string): string[] {
  const cocok = menu.filter((m) => (m.ke === "/" ? path === "/" : path === m.ke || path.startsWith(m.ke + "/")));
  cocok.sort((a, b) => b.ke.length - a.ke.length);
  return cocok.length ? [cocok[0].ke] : [];
}
