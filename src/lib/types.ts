/** Tipe respons backend (tenant bumi_lestari). Nominal uang berupa string desimal. */
export type Role = "admin" | "owner" | "staff";

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  must_change_password: boolean;
  aktif: boolean;
}

export interface AkunKas {
  id: string;
  kode: string;
  nama: string;
  jenis: "kas" | "bank" | "ewallet" | "kas_kecil" | "kas_iklan";
  plafon: string | null;
  saldo: string;
}

export interface Kategori {
  id: string;
  nama: string;
  jenis: "pemasukan" | "pengeluaran";
}

export interface Transaksi {
  id: string;
  tanggal: string;
  akun_id: string;
  kategori_id: string;
  jenis: "masuk" | "keluar";
  jumlah: string;
  keterangan: string;
  dibatalkan: boolean;
}

export interface TransaksiIn {
  tanggal?: string;
  akun_id: string;
  kategori_id: string;
  jenis: "masuk" | "keluar";
  jumlah: string;
  keterangan: string;
}

export interface Imprest {
  saldo: string;
  plafon: string;
  perlu_diisi: string;
}

export interface Dashboard {
  periode: string;
  selasa: string;
  akun: AkunKas[];
  total_kas: string;
  pemasukan_bulan_ini: string;
  biaya_bulan_ini: string;
  laba_bulan_ini: string;
  order_per_status: Record<string, number>;
  order_bulan_ini: number;
  omzet_order_bulan_ini: string;
  piutang_penjual_lain: string;
  utang_pemasok_siap_bayar: string;
  dana_cadangan: string;
  kas_kecil: Imprest | null;
  kas_iklan: Imprest | null;
  bagian_admin_pratinjau: string | null;
  bagian_owner_pratinjau: string | null;
}

export interface BarisKategori {
  kategori: string;
  jumlah: string;
  jumlah_transaksi: number;
}

export interface ArusAkun {
  akun_id: string;
  kode: string;
  nama: string;
  saldo_awal: string;
  masuk: string;
  keluar: string;
  transfer_masuk: string;
  transfer_keluar: string;
  saldo_akhir: string;
}

export interface LaporanUmum {
  dari: string;
  sampai: string;
  pemasukan: BarisKategori[];
  total_pemasukan: string;
  biaya: BarisKategori[];
  total_biaya: string;
  laba_bersih: string;
  di_luar_laba: BarisKategori[];
  arus_kas: ArusAkun[];
  total_kas_awal: string;
  total_kas_akhir: string;
}

export interface LaporanKasKecil {
  periode: string;
  nama: string;
  plafon: string;
  saldo_awal: string;
  total_pemakaian: string;
  total_pengisian: string;
  saldo_akhir: string;
  sesuai_plafon: boolean;
  per_kategori: BarisKategori[];
  per_minggu: { minggu_ke: number; dari: string; sampai: string; pemakaian: string; pengisian: string; saldo_akhir: string }[];
  transaksi: { tanggal: string; kategori: string; keterangan: string; jumlah: string }[];
  pengisian: { tanggal: string; jumlah: string; keterangan: string }[];
  saldo_fisik: string | null;
  selisih: string | null;
  status_selisih: "sesuai" | "lebih" | "kurang" | null;
}
