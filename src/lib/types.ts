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
  /** Saldo resmi: hanya entri yang sudah dikirim ke laporan keuangan. */
  saldo: string;
  /** Uang fisik: termasuk draf yang belum dikirim (backend Fase 1). */
  saldo_setelah_draf?: string;
}

export interface Kategori {
  id: string;
  nama: string;
  jenis: "pemasukan" | "pengeluaran";
  /** Tanda dari backend (Fase 1); bila belum ada, frontend memakai daftar nama di kategori.ts. */
  sistem?: boolean;
  untuk_staf?: boolean;
  khusus_admin?: boolean;
  masuk_laba?: boolean;
  grup?: string;
}

export interface Transfer {
  id: string;
  tanggal: string;
  dari_akun_id: string;
  ke_akun_id: string;
  jumlah: string;
  jenis: string;
  keterangan: string;
  dibatalkan: boolean;
  alasan_batal: string | null;
  di_luar_jadwal?: boolean;
  alasan_luar_jadwal?: string | null;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  akun_id: string;
  kategori_id: string;
  jenis: "masuk" | "keluar";
  jumlah: string;
  keterangan: string;
  platform_iklan_id?: string | null;
  melebihi_porsi?: boolean;
  dibatalkan: boolean;
  /** Sumber transaksi otomatis (pembayaran_pemasok, penerimaan_reseller, gaji, tagihan, bagi_hasil, sisihan); null = manual. */
  ref_jenis?: string | null;
  ref_id?: string | null;
  /** draf = belum dikirim ke laporan keuangan; terkirim = sudah masuk buku besar. */
  status_kirim?: StatusKirim;
  kiriman_id?: string | null;
  /** Koreksi atas bulan yang sudah tutup buku (YYYY-MM). */
  koreksi_periode?: string | null;
  created_at?: string;
}

export interface TransaksiIn {
  tanggal?: string;
  akun_id: string;
  kategori_id: string;
  jenis: "masuk" | "keluar";
  jumlah: string;
  keterangan: string;
  /** Setoran modal kedua dst. wajib dikonfirmasi admin. */
  konfirmasi_setoran_modal_kedua?: boolean;
  /** Koreksi atas bulan yang sudah tutup buku (YYYY-MM). */
  koreksi_periode?: string | null;
  /** Kas kecil/kas iklan kurang: kekurangannya dicatat sebagai talangan oleh orang ini. */
  talangan_oleh?: string | null;
  /** Wajib untuk pengeluaran (top up) kas iklan. */
  platform_iklan_id?: string | null;
}

/* ---------- Kirim ke laporan keuangan (posting berkelompok) ---------- */
export type StatusKirim = "draf" | "terkirim";
export type SumberKiriman = "kas_kecil" | "kas_iklan" | "penerimaan_reseller" | "pembayaran_pemasok" | "pencairan";

export interface EntriDraf {
  ref_jenis: string;
  ref_id: string;
  tanggal: string;
  jenis: "masuk" | "keluar";
  jumlah: string;
  keterangan: string;
}

export interface DrafSumber {
  sumber: SumberKiriman;
  label: string;
  jumlah_entri: number;
  total_masuk: string;
  total_keluar: string;
  total: string;
  tanggal_tertua: string | null;
  entri: EntriDraf[];
}

export interface Kiriman {
  id: string;
  nomor: string;
  sumber: SumberKiriman;
  sampai_tanggal: string | null;
  jumlah_entri: number;
  total: string;
  status: "terkirim" | "dibatalkan";
  dikirim_oleh: string;
  dikirim_pada: string;
  dibatalkan_oleh: string | null;
  dibatalkan_pada: string | null;
  alasan_batal: string | null;
  tutup_kas_mingguan_id: string | null;
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
  /* Backend Fase 1 */
  order_aktif_per_status?: Record<string, number>;
  tagihan_penjual_lain_minggu_ini?: string;
  belum_cair_sementara?: string;
  belum_cair?: string;
  talangan_belum_lunas?: string;
  draf_belum_dikirim?: DrafSumber[];
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
  /** Draf yang belum dikirim (tidak dihitung di laporan ini). */
  draf_belum_dikirim?: DrafSumber[];
  /** Bulan tutup buku: angka dari snapshot saat ditutup. */
  /** Belum cair per tanggal akhir (AB-BC-2): tidak masuk laba; perkiraan laba jika cair hanya informasi. */
  belum_cair?: string;
  perkiraan_laba_jika_cair?: string | null;
  dari_snapshot?: boolean;
  ditutup_pada?: string | null;
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
  /** Pengeluaran draf bulan ini yang belum dikirim (belum masuk laporan). */
  total_draf_belum_dikirim?: string;
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

export type StatusOrder = "dipesan" | "dikerjakan" | "diambil" | "diterima" | "dicat" | "dikirim" | "selesai" | "batal" | "retur";

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
  /* Fase 2.7: status cair diisi oleh pencairan; retur sebelum cair lewat POST /order/{id}/retur. */
  status_cair?: "belum" | "cair";
  tgl_cair?: string | null;
  potongan_aktual?: string | null;
  tgl_retur?: string | null;
  alasan_retur?: string | null;
  kembali_stok?: boolean;
  total_penjualan: string;
  laba_kotor: string;
  /** Sudah masuk pembayaran tukang / penerimaan penjual lain (draf maupun terkirim): harga & batal terkunci. */
  dibayar_tukang?: boolean;
  dibayar_penjual_lain?: boolean;
  terkunci?: boolean;
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
  /** Semua pembayaran aktif untuk Selasa ini (boleh lebih dari satu, mis. per tukang). */
  pembayaran_ids?: string[];
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
  status_kirim?: StatusKirim;
  kiriman_id?: string | null;
}

export interface PiutangPelanggan {
  pelanggan_id: string;
  nama: string;
  subtotal: string;
  items: {
    order_id: string;
    no_order: string;
    tanggal_order: string;
    tgl_dikirim?: string | null;
    jumlah: string;
    terlambat?: boolean;
  }[];
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
  /** true = laba terkunci dari snapshot tutup buku; false = pratinjau (bulan belum ditutup). */
  final?: boolean;
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

/* ---------- Tutup buku (Fase 2.3) ---------- */
export type StatusTutupBuku = "terbuka" | "ditutup" | "dibuka";

export interface ButirKesiapan {
  kode: string;
  label: string;
  siap: boolean;
  /** true = wajib beres sebelum tutup buku; false = hanya catatan. */
  penghalang: boolean;
  keterangan: string;
}

export interface BarisKategori {
  kategori: string;
  jumlah: string;
  jumlah_transaksi: number;
}

export interface KesiapanTutupBuku {
  periode: string;
  status: StatusTutupBuku;
  boleh_tutup: boolean;
  butir: ButirKesiapan[];
  pratinjau: { pemasukan: BarisKategori[]; biaya: BarisKategori[]; di_luar_laba: BarisKategori[]; total_pemasukan: string; total_biaya: string; laba_bersih: string };
  belum_cair: string;
}

export interface TutupBuku {
  id: string;
  periode: string;
  status: Exclude<StatusTutupBuku, "terbuka">;
  ditutup_oleh: string;
  ditutup_pada: string;
  dibuka_oleh: string | null;
  dibuka_pada: string | null;
  alasan_buka: string | null;
  laba_bersih: string | null;
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
  status_kirim?: StatusKirim;
  kiriman_id?: string | null;
}

export interface RincianPembayaran extends PembayaranPemasok {
  transaksi_id: string | null;
  total_qty: number;
  items: { order_id: string; no_order: string; produk_sku: string; produk_nama: string; qty: number; pemasok_nama: string; jumlah: string }[];
}

/* ---------- Belum cair (Fase 2.7) ---------- */

export interface OrderBelumCair {
  order_id: string;
  no_order: string;
  tgl_dikirim: string;
  penjualan: string;
  potongan: string;
  perkiraan_cair: string;
  status: StatusOrder;
}

export interface SaluranBelumCair {
  saluran_id: string;
  nama: string;
  akun_id: string | null;
  jumlah_order: number;
  total_penjualan: string;
  total_perkiraan_cair: string;
  tgl_kirim_tertua: string | null;
  order: OrderBelumCair[];
}

export interface BelumCair {
  per_tanggal: string;
  jumlah_order: number;
  total_penjualan: string;
  total_perkiraan_cair: string;
  tgl_kirim_tertua: string | null;
  per_saluran: SaluranBelumCair[];
}

/* ---------- Pencairan & format file penghasilan (Fase 2.4/2.5) ---------- */

export type KolomTujuan = "kode_pesanan" | "tanggal_cair" | "harga_jual" | "potongan_biaya" | "jumlah_cair";
export type KelompokPencairan = "cocok" | "selisih" | "tidak_cocok" | "duplikat" | "penyesuaian";

export interface KolomPeta {
  kolom_tujuan: KolomTujuan;
  kolom_sumber: string;
  operasi: "ambil" | "jumlahkan" | "mutlak" | "balik_tanda";
  nama_rincian: string | null;
}

export interface FormatPenghasilanIn {
  saluran_id: string;
  nama: string;
  jenis_file: "xlsx" | "csv";
  nama_sheet: string | null;
  baris_header: number;
  baris_data_mulai: number | null;
  format_tanggal: string;
  pemisah_desimal: "," | ".";
  pemisah_ribuan: "." | "," | " " | "";
  aturan_tanda: "mutlak" | "positif" | "kurung";
  aturan_jenis_baris: { kolom?: string | null; retur?: string[]; penyesuaian?: string[]; negatif_penyesuaian?: boolean };
  satuan_baris: "per_pesanan" | "per_produk";
  aturan_abaikan: Record<string, unknown>;
  catatan: string;
  kolom: KolomPeta[];
}

export interface FormatPenghasilan extends FormatPenghasilanIn {
  id: string;
  versi: number;
  status: "draf" | "aktif" | "arsip";
  contoh_nama: string | null;
  hasil_uji: { lulus: boolean; jumlah_sah: number; jumlah_masalah: number; total_cair: string; neto: boolean; diuji_pada: string } | null;
  lulus_uji: boolean;
  diaktifkan_pada: string | null;
  created_at: string;
}

export interface BacaHeader {
  sheets: string[];
  nama_sheet: string | null;
  baris_header: number;
  kolom: string[];
  contoh: string[][];
  saran: Partial<Record<KolomTujuan, string | null>>;
}

export interface MasalahBaris {
  baris: number;
  kolom: string;
  nilai: string;
  alasan: string;
}

export interface BarisStandar {
  baris_file: number | null;
  kode_pesanan: string;
  tanggal_cair: string;
  harga_jual: string | null;
  potongan_biaya: string | null;
  rincian_biaya: Record<string, string>;
  jumlah_cair: string;
  jenis_baris: "pesanan" | "penyesuaian" | "retur";
  mode_catat: "bruto" | "neto";
  catatan: string[];
  kelompok: KelompokPencairan;
  order_id: string | null;
  perkiraan_cair: string | null;
  selisih: string;
  alasan: string;
}

export interface UjiFormat {
  lulus: boolean;
  jumlah_sah: number;
  jumlah_masalah: number;
  total_cair: string;
  neto: boolean;
  baris: BarisStandar[];
  masalah: MasalahBaris[];
}

export interface PratinjauPencairan {
  saluran_id: string;
  format_id: string | null;
  format_versi: number | null;
  nama_file: string;
  kelompok: Record<KelompokPencairan, { jumlah: number; total_cair: string }>;
  bermasalah: number;
  baris: BarisStandar[];
  masalah: MasalahBaris[];
  jumlah_disimpan: number;
  total_dibukukan: string;
  neto: boolean;
}

export interface PencairanBaris {
  id: string;
  kode_pesanan: string;
  tanggal_cair: string;
  harga_jual: string | null;
  potongan_biaya: string | null;
  rincian_biaya: Record<string, string>;
  jumlah_cair: string;
  jenis_baris: string;
  mode_catat: string;
  order_id: string | null;
  status_cocok: "cocok" | "selisih" | "tidak_cocok";
  selisih: string;
  baris_file: number | null;
  masalah: string[] | null;
  dibatalkan: boolean;
}

export interface PencairanUnggahan {
  id: string;
  saluran_id: string;
  format_id: string | null;
  format_versi: number | null;
  nama_file: string;
  tanggal: string;
  periode_dari: string | null;
  periode_sampai: string | null;
  jumlah_baris: number;
  total: string;
  total_harga_jual: string;
  total_potongan: string;
  status_kirim: StatusKirim;
  kiriman_id: string | null;
  diunggah_oleh: string;
  dibatalkan: boolean;
  alasan_batal: string | null;
  created_at: string;
  baris?: PencairanBaris[];
}

/* ---------- Talangan (Fase 2, item 1.10) ---------- */

export interface TalanganBayar {
  id: string;
  transfer_id: string;
  tanggal: string;
  jumlah: string;
  dibatalkan: boolean;
}

export interface Talangan {
  id: string;
  tanggal: string;
  nama: string;
  akun_asal_id: string;
  akun_asal_nama: string;
  kategori_id: string;
  keterangan: string;
  total_pengeluaran: string;
  jumlah: string;
  terbayar: string;
  sisa: string;
  status_kirim: StatusKirim;
  dibatalkan: boolean;
  alasan_batal: string | null;
  created_at: string;
  bayar: TalanganBayar[];
}

/* ---------- Kas iklan (Fase 2.9/2.10) ---------- */

export interface PlatformIklan {
  id: string;
  nama: string;
  grup: "internal" | "eksternal";
  saluran_id: string | null;
  aktif: boolean;
}

export interface BudgetIklan {
  periode: string;
  budget_total: string;
  dasar: "pengaturan" | "plafon";
  grup: { grup: "internal" | "eksternal"; porsi: string; budget: string; terpakai: string; sisa: string }[];
}

export interface PengaturanIklan {
  porsi_internal: string;
  porsi_eksternal: string;
  budget_bulanan: string | null;
}

export interface PlafonLog {
  id: string;
  akun_id: string;
  tanggal: string;
  dari: string;
  ke: string;
  oleh: string;
  alasan: string;
  created_at: string;
}

// Laporan keuangan Fase 2.13 (spesifikasi 9.1-9.3, 9.7)
export interface BarisNilai {
  label: string;
  jumlah: string;
  rincian: BarisNilai[];
}
export interface LabaRugi {
  periode: string;
  sementara: boolean;
  penjualan: BarisNilai[];
  total_penjualan: string;
  biaya_marketplace: BarisNilai[];
  total_biaya_marketplace: string;
  penjualan_bersih: string;
  hpp: string;
  laba_kotor: string;
  margin_persen: string | null;
  biaya_operasional: BarisNilai[];
  total_biaya_operasional: string;
  pendapatan_lain: BarisNilai[];
  laba_bersih: string;
  hpp_dicocokkan: string;
  belum_cair: { total_penjualan: string; total_perkiraan_cair: string; jumlah_order: number; tgl_kirim_tertua: string | null; perkiraan_laba_jika_cair: string };
  di_luar_laba: BarisNilai[];
}
export interface Neraca {
  per_tanggal: string;
  aset_kas: BarisNilai[];
  piutang_penjual_lain: string;
  belum_cair: BarisNilai[];
  total_aset: string;
  utang_pemasok: BarisNilai[];
  dana_gaji_belum_dibayar: string;
  talangan: BarisNilai[];
  total_kewajiban: string;
  modal: BarisNilai[];
  total_modal: string;
  selisih: string;
}
export interface MarginBaris {
  label: string;
  qty: number;
  jumlah_order: number;
  penjualan: string;
  potongan: string;
  hpp: string;
  laba_kotor: string;
  margin_persen: string | null;
}
export interface HppMargin {
  periode: string;
  sementara: boolean;
  per_produk: MarginBaris[];
  per_saluran: MarginBaris[];
  total: MarginBaris;
}
export interface RingkasanOwner {
  periode: string;
  sementara: boolean;
  penjualan: string;
  hpp: string;
  biaya_iklan: string;
  biaya_operasional_lain: string;
  laba_bersih: string;
  tren: { periode: string; penjualan: string; laba_bersih: string; sementara: boolean }[];
  total_kas: string;
  piutang: string;
  utang: string;
  modal: string;
  setoran_modal: string;
  laba_ditahan: string;
  bagi_hasil_dibayar: string;
  bagi_hasil: { periode: string; laba_bersih: string; persen_owner: string; bagian_owner: string; dibayar: boolean; tanggal_bayar: string | null }[];
}
