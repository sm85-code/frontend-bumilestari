import type { AkunKas, Kategori } from "./types";

/**
 * Aturan kategori di form manual (Fase 0, hanya di frontend; backend belum menolak — lihat Fase 1.2).
 * Nama dicocokkan dengan nama kategori dari seeder backend (`DEFAULT_KATEGORI` di
 * `tenants/bumi_lestari/.../infrastructure/seeder.py`), tanpa membedakan huruf besar/kecil.
 */

/** Kategori kas kecil / staf, berurutan seperti tombol di layar. "Pengeluaran lain" tampil sebagai "Lainnya". */
export const KATEGORI_KAS_KECIL = ["Transport", "Packing", "Operasional", "Pengeluaran lain"] as const;

/**
 * Kategori sistem: hanya dipakai transaksi otomatis dari halaman asalnya (bagi hasil, gaji, pembayaran
 * tukang & supplier, tagihan rutin, penerimaan penjual lain), jadi tidak muncul di form manual.
 * "Penjualan marketplace" BELUM termasuk: sampai unggah pencairan (Fase 2) ada, pemasukan marketplace
 * masih dicatat manual di Kas & transaksi.
 */
export const KATEGORI_SISTEM = [
  "Bagi hasil",
  "Gaji karyawan",
  "Biaya produksi / pembelian barang",
  "Langganan & utilitas",
  "Penjualan reseller",
] as const;

/** Nama tampil sesuai istilah baku (nama di database tidak diubah). */
const LABEL: Record<string, string> = {
  "pengeluaran lain": "Lainnya",
  "penjualan reseller": "Penjualan penjual lain",
  "langganan & utilitas": "Tagihan rutin",
};

const kunci = (nama: string) => nama.trim().toLowerCase();
const SISTEM = new Set<string>(KATEGORI_SISTEM.map(kunci));

export function labelKategori(nama: string | null | undefined): string {
  if (!nama) return "—";
  return LABEL[kunci(nama)] ?? nama;
}

export function isKategoriSistem(k: Pick<Kategori, "nama">): boolean {
  return SISTEM.has(kunci(k.nama));
}

const jenisKategori = (jenis: "masuk" | "keluar") => (jenis === "masuk" ? "pemasukan" : "pengeluaran");

/** Kategori untuk staf / akun Kas kecil: hanya 4 kategori, urut sesuai `KATEGORI_KAS_KECIL`. */
export function kategoriKasKecil(kategori: readonly Kategori[]): Kategori[] {
  const ada = new Map(kategori.filter((k) => k.jenis === "pengeluaran").map((k) => [kunci(k.nama), k]));
  return KATEGORI_KAS_KECIL.map((n) => ada.get(kunci(n))).filter((k): k is Kategori => Boolean(k));
}

/** Kategori yang boleh dipilih di form manual Kas & transaksi: sesuai jenis, tanpa kategori sistem. */
export function kategoriManual(kategori: readonly Kategori[], jenis: "masuk" | "keluar"): Kategori[] {
  return kategori.filter((k) => k.jenis === jenisKategori(jenis) && !isKategoriSistem(k));
}

/**
 * Daftar kategori untuk form transaksi. Staf, atau pengeluaran dari akun Kas kecil, hanya mendapat 4 kategori
 * kas kecil; selain itu kategori manual tanpa kategori sistem.
 */
export function pilihanKategori(
  kategori: readonly Kategori[],
  opsi: { jenis: "masuk" | "keluar"; staf?: boolean; akun?: Pick<AkunKas, "jenis"> | null },
): Kategori[] {
  if (opsi.staf || (opsi.jenis === "keluar" && opsi.akun?.jenis === "kas_kecil")) return kategoriKasKecil(kategori);
  return kategoriManual(kategori, opsi.jenis);
}
