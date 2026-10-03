import type { AkunKas, Kategori } from "./types";

/**
 * Aturan kategori di form manual. Sejak Fase 1 backend MENOLAK kategori yang salah (kategori sistem 422, staf di luar
 * 4 kategori 403, Prive/Setoran modal khusus admin, Biaya iklan hanya di Kas iklan), jadi daftar di sini hanya
 * agar pilihan yang salah tidak ditawarkan. Tanda dari server (`sistem`, `untuk_staf`, `khusus_admin`) diutamakan;
 * bila server lama belum mengirimnya, dipakai cocok-nama dengan seeder backend (`kategori_core.py`).
 */

/** Kategori kas kecil / staf, berurutan seperti tombol di layar. "Pengeluaran lain" tampil sebagai "Lainnya". */
export const KATEGORI_KAS_KECIL = ["Transport", "Packing", "Operasional", "Pengeluaran lain"] as const;

/**
 * Kategori sistem: hanya dipakai transaksi otomatis dari halaman asalnya (bagi hasil, gaji, pembayaran
 * tukang & supplier, tagihan rutin, penerimaan penjual lain), jadi tidak muncul di form manual.
 * Pemasukan marketplace juga tidak dicatat manual: nanti hanya dari impor file Excel marketplace (lihat
 * `isKategoriMarketplace`).
 */
export const KATEGORI_SISTEM = [
  "Bagi hasil",
  "Gaji karyawan",
  "Biaya produksi / pembelian barang",
  "Langganan & utilitas",
  "Penjualan reseller",
  "Biaya marketplace",
  "Kerugian retur",
] as const;

/** Hanya admin yang boleh memakai kategori ini (modal & penarikan pemilik). */
export const KATEGORI_KHUSUS_ADMIN = ["Prive", "Setoran modal"] as const;
export const KATEGORI_BIAYA_IKLAN = "Biaya iklan";
export const KATEGORI_SETORAN_MODAL = "Setoran modal";

/** Nama tampil sesuai istilah baku (nama di database tidak diubah). */
const LABEL: Record<string, string> = {
  "pengeluaran lain": "Lainnya",
  "penjualan reseller": "Penjualan penjual lain",
  "langganan & utilitas": "Tagihan rutin",
};

const kunci = (nama: string) => nama.trim().toLowerCase();
const SISTEM = new Set<string>(KATEGORI_SISTEM.map(kunci));
const KHUSUS_ADMIN = new Set<string>(KATEGORI_KHUSUS_ADMIN.map(kunci));

export function labelKategori(nama: string | null | undefined): string {
  if (!nama) return "—";
  return LABEL[kunci(nama)] ?? nama;
}

export function isKategoriSistem(k: Pick<Kategori, "nama" | "sistem">): boolean {
  return k.sistem ?? SISTEM.has(kunci(k.nama));
}

export function isKhususAdmin(k: Pick<Kategori, "nama" | "khusus_admin">): boolean {
  return k.khusus_admin ?? KHUSUS_ADMIN.has(kunci(k.nama));
}

export const isBiayaIklan = (k: Pick<Kategori, "nama">) => kunci(k.nama) === kunci(KATEGORI_BIAYA_IKLAN);
export const isSetoranModal = (k: Pick<Kategori, "nama">) => kunci(k.nama) === kunci(KATEGORI_SETORAN_MODAL);

/**
 * Pemasukan marketplace (mis. "Penjualan marketplace", "Penjualan Shopee") hanya akan masuk lewat impor file
 * Excel marketplace (dibangun nanti), jadi disembunyikan dari form manual.
 */
const POLA_MARKETPLACE = /marketplace|shopee|tokopedia|tiktok|lazada|bukalapak|blibli/i;

export function isKategoriMarketplace(k: Pick<Kategori, "nama" | "jenis">): boolean {
  return k.jenis === "pemasukan" && POLA_MARKETPLACE.test(k.nama);
}

const jenisKategori = (jenis: "masuk" | "keluar") => (jenis === "masuk" ? "pemasukan" : "pengeluaran");

/** Kategori untuk staf / akun Kas kecil: hanya 4 kategori, urut sesuai `KATEGORI_KAS_KECIL`. */
export function kategoriKasKecil(kategori: readonly Kategori[]): Kategori[] {
  if (kategori.some((k) => k.untuk_staf !== undefined)) {
    const urut = (k: Kategori) => {
      const i = KATEGORI_KAS_KECIL.findIndex((n) => kunci(n) === kunci(k.nama));
      return i < 0 ? 99 : i;
    };
    return kategori.filter((k) => k.untuk_staf && k.jenis === "pengeluaran").sort((a, b) => urut(a) - urut(b));
  }
  const ada = new Map(kategori.filter((k) => k.jenis === "pengeluaran").map((k) => [kunci(k.nama), k]));
  return KATEGORI_KAS_KECIL.map((n) => ada.get(kunci(n))).filter((k): k is Kategori => Boolean(k));
}

/** Kategori yang boleh dipilih di form manual Kas & transaksi: sesuai jenis, tanpa kategori sistem & marketplace. */
export function kategoriManual(kategori: readonly Kategori[], jenis: "masuk" | "keluar"): Kategori[] {
  return kategori.filter((k) => k.jenis === jenisKategori(jenis) && !isKategoriSistem(k) && !isKategoriMarketplace(k));
}

/**
 * Daftar kategori untuk form transaksi (cermin aturan backend):
 * - staf, atau pengeluaran dari Kas kecil: hanya 4 kategori kas kecil;
 * - akun Kas iklan: hanya Biaya iklan; Biaya iklan tidak ditawarkan di akun lain;
 * - Prive & Setoran modal hanya untuk admin, dan Setoran modal tidak di Kas kecil/Kas iklan;
 * - kategori sistem & pemasukan marketplace tidak pernah ditawarkan.
 */
export function pilihanKategori(
  kategori: readonly Kategori[],
  opsi: { jenis: "masuk" | "keluar"; staf?: boolean; admin?: boolean; akun?: Pick<AkunKas, "jenis"> | null },
): Kategori[] {
  if (opsi.staf || (opsi.jenis === "keluar" && opsi.akun?.jenis === "kas_kecil")) return kategoriKasKecil(kategori);
  const iklan = opsi.akun?.jenis === "kas_iklan";
  const imprest = iklan || opsi.akun?.jenis === "kas_kecil";
  return kategoriManual(kategori, opsi.jenis).filter((k) => {
    if (iklan !== isBiayaIklan(k)) return false;
    if (isKhususAdmin(k) && !opsi.admin) return false;
    if (imprest && isSetoranModal(k)) return false;
    return true;
  });
}
