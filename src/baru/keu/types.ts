export type Money = string;
export interface Page<T> { rows: T[]; total: number; limit: number; offset: number }
export interface Channel { id: string; nama: string; sistem: "manual" | "store" | "marketplace_erp"; akun_ref: string; aktif: boolean }
export interface ProductVariant { kategori: string; nilai: string }
export interface Product { id: string; nama: string; nama_asli: string; sku: string; sku_induk: string | null; gambar_url: string; varian_list: ProductVariant[]; jenis: "kayu" | "non_kayu" | null; harga_jual: Money; biaya_acuan: Money; aktif: boolean; status: "draf" | "master" }
export interface Account { id: string; kode: string; nama: string; jenis: string; saldo_awal: Money; aktif: boolean }
export interface Customer { id: string; nama: string; segmen: "umkm" | "reseller" | null; kontak: string; aktif: boolean }
export interface Category { id: string; nama: string; jenis: "pemasukan" | "pengeluaran" }
export interface Vendor { id: string; kode: string; nama: string; jenis: "tukang_kayu" | "supplier"; tipe: "kayu" | "non_kayu"; kontak: string; alamat: string; keterangan: string; aktif: boolean; status: "aktif" | "non_aktif" }
export interface Item { id: string; pesanan_id: string; sumber_ref: string; produk_id: string | null; nama_snapshot: string; varian_snapshot: string; qty: number; harga_satuan: Money; subtotal_sumber: Money }
export interface Order { id: string; saluran_id: string; nomor: string; tanggal: string; status: "draf" | "aktif" | "selesai" | "batal"; status_sumber: string; total_sumber: Money; items: Item[] }
export interface Allocation { id: string; item_id: string; vendor_id: string; qty: number; biaya_satuan: Money; dibatalkan: boolean }
export interface Settlement extends Cancellation { id: string; saluran_id: string; sumber_ref: string; tanggal_cair: string; bruto: Money; potongan: Money; penyesuaian: Money; neto: Money; status: string }
export interface PayoutAllocation { id: string; settlement_id: string; item_id: string; jumlah: Money }
export interface Transaction extends Cancellation { id: string; tanggal: string; akun_id: string; kategori_id: string; jenis: "masuk" | "keluar"; jumlah: Money; status: string; keterangan: string }
export interface Inbox { id: string; impor_id: string | null; entitas: string; sumber_ref: string; status: string; nomor_baris: number | null; kesalahan: { pesan: string }[]; payload: Record<string, unknown> }
export interface ImportBatch { id: string; nama_file: string; jenis: string; status: string; rows: Inbox[] }
export interface Dashboard { saldo_kas: Money; kas_masuk: Money; kas_keluar: Money; nilai_pesanan: Money; biaya_vendor: Money; pesanan: number; belum_dipetakan: number; settlement_draf: number; masukan_gagal: number }

export interface Cancellation { alasan_batal?: string; dibatalkan_oleh?: string | null; dibatalkan_at?: string | null }

export interface Coa { id: string; kode: string; nama: string; jenis: "aset" | "kewajiban" | "ekuitas" | "pendapatan" | "beban"; kelompok: string; kas_akun_id: string | null; sistem: boolean; aktif: boolean }
export interface Book { aktif: boolean; pengaturan: { tanggal_awal: string; metode_stok: string; tanggal_status: string } | null }
export interface JournalLine { id: string; coa_id: string; debet: Money; kredit: Money; vendor_id: string | null; produk_id: string | null; pesanan_id: string | null; arus: string | null }
export interface Journal extends Cancellation { id: string; tanggal: string; jenis: string; status: string; keterangan: string; baris: JournalLine[] }
export interface Stock { id: string; sku: string; nama: string; qty: number; nilai: Money; batch: { id: string; tanggal: string; qty: number; nilai: Money; jurnal_id: string }[] }
export interface Receivable { id: string; nomor: string; status_sumber: string; pengiriman: Money; escrow: Money }
export interface VendorDebt { id: string; nama: string; utang: Money }
export interface ReportRow { id?: string; kode?: string; nama: string; kelompok: string; nilai: Money }
export interface FinancialReports {
  tanggal_awal: string; tanggal_akhir: string;
  laba_rugi: { pendapatan: ReportRow[]; beban: ReportRow[]; pendapatan_bersih: Money; hpp: Money; beban_operasional: Money; shu: Money };
  neraca: { aset: ReportRow[]; kewajiban: ReportRow[]; ekuitas: ReportRow[]; total_aset: Money; total_kewajiban: Money; total_ekuitas: Money; selisih: Money };
  arus_kas: { kelompok: Record<string, { masuk: Money; keluar: Money; neto: Money }>; saldo_awal: Money; saldo_akhir: Money };
}
