/**
 * Transaksi/transfer otomatis: dibuat sistem dari halaman lain dan hanya boleh dibatalkan dari halaman asalnya
 * (membatalkan dari Kas & transaksi akan membuat sumbernya tidak sinkron). Nilai `ref_jenis` dari backend
 * (`models_pembayaran.py`: REF_*).
 */
export interface Sumber {
  label: string;
  ke: string;
}

const SUMBER: Record<string, Sumber> = {
  pembayaran_pemasok: { label: "Bayar tukang & supplier", ke: "/pesanan-tukang" },
  penerimaan_reseller: { label: "Tagihan penjual lain", ke: "/penjual-lain" },
  gaji: { label: "Gaji & tagihan rutin", ke: "/gaji" },
  tagihan: { label: "Gaji & tagihan rutin", ke: "/gaji" },
  bagi_hasil: { label: "Bagi hasil", ke: "/bagi-hasil" },
  sisihan: { label: "Tutup Kas Mingguan", ke: "/selasa" },
};

/** Halaman asal transaksi otomatis, atau null bila transaksi manual. ref_jenis yang belum dikenal tetap dianggap otomatis. */
export function sumberTransaksi(t: { ref_jenis?: string | null }): Sumber | null {
  if (!t.ref_jenis) return null;
  return SUMBER[t.ref_jenis] ?? { label: "halaman asalnya", ke: "" };
}

/** Jenis transfer dari backend (JENIS_TRANSFER). */
export const LABEL_JENIS_TRANSFER: Record<string, string> = {
  biasa: "Transfer",
  pengisian_kas_kecil: "Isi ulang kas kecil",
  pengisian_kas_iklan: "Isi ulang kas iklan",
  sisihan_dana: "Sisihan gaji",
};

/** Transfer sisihan gaji hanya boleh dibatalkan dari Tutup Kas Mingguan (bersama provisi biaya gajinya). */
export function sumberTransfer(t: { jenis: string }): Sumber | null {
  return t.jenis === "sisihan_dana" ? SUMBER.sisihan : null;
}
