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

/* ---------- Master data & order ---------- */
export interface Produk {
  id: string;
  sku: string;
  nama: string;
  jenis_produk: "kayu" | "non_kayu";
  ukuran: string;
  harga_jual: string;
  biaya_pokok_default: string;
  aktif: boolean;
}

export interface Pemasok {
  id: string;
  nama: string;
  jenis: "tukang_kayu" | "supplier";
  kode: string;
  kontak: string;
  no_wa: string;
  nama_bank: string;
  no_rekening: string;
  atas_nama: string;
  catatan: string;
  aktif: boolean;
}

export interface Saluran {
  id: string;
  nama: string;
  jenis: "marketplace" | "web" | "reseller";
  akun_id: string | null;
  aktif: boolean;
}

export interface Pelanggan {
  id: string;
  nama: string;
  kode: string;
  alamat: string;
  kontak: string;
  no_wa: string;
  catatan: string;
  aktif: boolean;
}

export interface HargaGrosir {
  id: string;
  produk_id: string;
  pelanggan_id: string;
  harga: string;
  harga_cat_jasa: string;
  harga_packing_biasa: string;
  harga_packing_kayu: string;
}

export type StatusOrder = "dipesan" | "dikerjakan" | "diambil" | "diterima" | "dicat" | "dikirim" | "selesai" | "batal";

export interface Order {
  id: string;
  no_order: string;
  tanggal_order: string;
  saluran_id: string;
  pelanggan_id: string | null;
  nama_pembeli: string;
  produk_id: string;
  qty: number;
  harga_satuan: string;
  harga_cat_jasa: string;
  jenis_packing: "biasa" | "kayu";
  harga_packing: string;
  biaya_proses: string;
  warna: string;
  potongan_marketplace: string;
  pemasok_id: string | null;
  biaya_pokok: string;
  butuh_cat: boolean;
  status: StatusOrder;
  tgl_pesan_pemasok: string | null;
  tgl_diambil: string | null;
  tgl_dicat: string | null;
  tgl_dikirim: string | null;
  tgl_selesai: string | null;
  catatan: string;
  total_penjualan: string;
  laba_kotor: string;
}

/* ---------- Selasa: pembayaran tukang, penjual lain ---------- */
export interface ItemSiapBayar {
  order_id: string;
  no_order: string;
  produk_id: string;
  qty: number;
  tgl_diambil: string;
  jumlah: string;
  terlambat: boolean;
}

export interface SiapBayar {
  selasa: string;
  batas_diambil: string;
  sudah_dicatat_id: string | null;
  total: string;
  pemasok: { pemasok_id: string; nama: string; jenis: string; subtotal: string; items: ItemSiapBayar[] }[];
}

export interface PembayaranPemasok {
  id: string;
  selasa: string;
  tanggal: string;
  akun_id: string;
  total: string;
  dibatalkan: boolean;
}

export interface PiutangPelanggan {
  pelanggan_id: string;
  nama: string;
  subtotal: string;
  items: { order_id: string; no_order: string; tanggal_order: string; jumlah: string }[];
}

export interface Bagikan {
  nomor: string;
  penerima: string;
  no_wa: string | null;
  url: string;
  pesan: string;
  wa_link: string;
  kedaluwarsa: string;
}

export interface PengisianImprest {
  akun_id: string;
  plafon: string;
  saldo: string;
  perlu_diisi: string;
  saldo_kas_utama: string;
  cukup: boolean;
}

export interface Sisihan {
  selasa: string;
  periode: string;
  minggu_ke: number;
  items: { jenis: string; nama: string; jumlah: string }[];
  total: string;
  saldo_kas_utama: string;
  cukup: boolean;
  sudah_dicatat_id: string | null;
  catatan: string;
}

/* ---------- Gaji, langganan, bagi hasil ---------- */
export interface Karyawan {
  id: string;
  nama: string;
  peran: string;
  gaji_bulanan: string;
  user_id: string | null;
  aktif: boolean;
}

export interface Gaji {
  id: string;
  periode: string;
  karyawan_id: string;
  jumlah: string;
  tanggal_bayar: string | null;
  jatuh_tempo: string;
}

export interface Langganan {
  id: string;
  nama: string;
  jumlah_bulanan: string;
  aktif: boolean;
}

export interface Tagihan {
  id: string;
  periode: string;
  langganan_id: string;
  jumlah: string;
  tanggal_bayar: string;
  dibatalkan: boolean;
}

export interface BagiHasilHitung {
  periode: string;
  pemasukan: string;
  pengeluaran: string;
  laba_bersih: string;
  persen_admin: string;
  persen_owner: string;
  bagian_admin: string;
  bagian_owner: string;
}

export interface BagiHasil {
  id: string;
  periode: string;
  laba_bersih: string;
  persen_admin: string;
  persen_owner: string;
  bagian_admin: string;
  bagian_owner: string;
  tanggal_bayar: string | null;
  dibatalkan: boolean;
}

/* ---------- Pengguna & profil ---------- */
export interface Profil {
  nama_usaha: string;
  alamat: string;
  telepon: string;
  email: string;
  catatan: string;
  biaya_proses_order: string;
  info_pembayaran: string;
  nama_usaha_lama: string;
  nama_usaha_berlaku_mulai: string | null;
  proporsi_bagi_hasil: { id: string; penerima: "admin" | "owner"; persen: string }[];
}

export interface InvoiceItem {
  order_id: string;
  tanggal: string;
  hari: string;
  nama_barang: string;
  ukuran: string;
  qty: number;
  harga_barang: string;
  biaya_jasa_pengecatan: string;
  biaya_proses: string;
  total: string;
  terlambat: boolean;
}

export interface Invoice {
  nomor: string;
  minggu: { label: string; periode_awal: string; periode_akhir: string };
  tgl_invoice: string;
  jatuh_tempo: string;
  kepada: { pelanggan_id: string; nama: string; alamat: string };
  items: InvoiceItem[];
  total_barang: string;
  total_jasa_pengecatan: string;
  total_biaya_proses: string;
  grand_total: string;
}

export interface PenerimaanReseller {
  id: string;
  tanggal: string;
  pelanggan_id: string;
  akun_id: string;
  total: string;
  dibatalkan: boolean;
}

export interface RincianPembayaran extends PembayaranPemasok {
  transaksi_id: string | null;
  total_qty: number;
  items: { order_id: string; no_order: string; produk_sku: string; produk_nama: string; qty: number; pemasok_nama: string; jumlah: string }[];
}
