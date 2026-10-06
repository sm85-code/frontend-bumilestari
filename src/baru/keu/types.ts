export type Money = string;
export interface Page<T> { rows: T[]; total: number; limit: number; offset: number }
export interface Channel { id: string; nama: string; sistem: "manual" | "store" | "marketplace_erp"; akun_ref: string; aktif: boolean }
export interface Product { id: string; nama: string; sku: string; jenis: "kayu" | "non_kayu"; biaya_acuan: Money; aktif: boolean }
export interface Account { id: string; kode: string; nama: string; jenis: string; saldo_awal: Money }
export interface Customer { id: string; nama: string; segmen: "umkm" | "reseller" | null; kontak: string }
export interface Category { id: string; nama: string; jenis: "pemasukan" | "pengeluaran" }
export interface Vendor { id: string; nama: string; jenis: "tukang_kayu" | "supplier"; kontak: string }
export interface Slot { jenis: Vendor["jenis"]; nomor: number; kode: string; vendor_id: string | null; vendor: Vendor | null }
export interface Item { id: string; pesanan_id: string; sumber_ref: string; produk_id: string | null; nama_snapshot: string; varian_snapshot: string; qty: number; harga_satuan: Money; subtotal_sumber: Money }
export interface Order { id: string; saluran_id: string; nomor: string; tanggal: string; status: "draf" | "aktif" | "selesai" | "batal"; status_sumber: string; total_sumber: Money; items: Item[] }
export interface Allocation { id: string; item_id: string; vendor_id: string; qty: number; biaya_satuan: Money; dibatalkan: boolean }
export interface Settlement { id: string; saluran_id: string; sumber_ref: string; tanggal_cair: string; bruto: Money; potongan: Money; penyesuaian: Money; neto: Money; status: string }
export interface PayoutAllocation { id: string; settlement_id: string; item_id: string; jumlah: Money }
export interface Transaction { id: string; tanggal: string; akun_id: string; kategori_id: string; jenis: "masuk" | "keluar"; jumlah: Money; status: string; keterangan: string }
export interface Inbox { id: string; impor_id: string | null; entitas: string; sumber_ref: string; status: string; nomor_baris: number | null; kesalahan: { pesan: string }[]; payload: Record<string, unknown> }
export interface ImportBatch { id: string; nama_file: string; jenis: string; status: string; rows: Inbox[] }
export interface Dashboard { saldo_kas: Money; kas_masuk: Money; kas_keluar: Money; nilai_pesanan: Money; biaya_vendor: Money; pesanan: number; belum_dipetakan: number; settlement_draf: number; masukan_gagal: number }
