import type { Page, Route } from "@playwright/test";

/** API Bumi Lestari tiruan untuk tes klik: data tetap, permintaan tulis dicatat di `panggilan`. */
export interface Panggilan {
  metode: string;
  path: string;
  body: unknown;
}

const pengguna = { id: "u1", nama: "Bu Admin", email: "a@t.com", role: "admin", must_change_password: false, aktif: true };
const akun = [
  { id: "a1", kode: "KAS_UTAMA", nama: "Kas utama", jenis: "kas", plafon: null, saldo: "3400000.00" },
  { id: "a2", kode: "SALDO_SHOPEE", nama: "Saldo Shopee", jenis: "ewallet", plafon: null, saldo: "1250000.00" },
  { id: "a3", kode: "KAS_KECIL", nama: "Kas kecil", jenis: "kas_kecil", plafon: "3000000.00", saldo: "2850000.00" },
  { id: "a4", kode: "DANA_CADANGAN", nama: "Dana cadangan (gaji)", jenis: "kas", plafon: null, saldo: "1000000.00" },
  { id: "a5", kode: "KAS_IKLAN", nama: "Kas iklan", jenis: "kas_iklan", plafon: "2000000.00", saldo: "1600000.00" },
];
const produk = [
  { id: "p1", sku: "PRT-01", nama: "Partisi Rak Tengah [2 rak]", jenis_produk: "kayu", ukuran: "150x20x200", harga_jual: "850000", biaya_pokok_default: "500000", aktif: true },
  { id: "p2", sku: "LMP-01", nama: "Lampu", jenis_produk: "non_kayu", ukuran: "", harga_jual: "100000", biaya_pokok_default: "60000", aktif: true },
];
const pemasok = [
  { id: "m1", nama: "AHMAD NUR ALIM", jenis: "tukang_kayu", kode: "005", kontak: "", no_wa: "081234567890", nama_bank: "Mandiri", no_rekening: "1770022968629", atas_nama: "", catatan: "", aktif: true },
  { id: "m2", nama: "Toko Lampu", jenis: "supplier", kode: "001", kontak: "", no_wa: "", nama_bank: "", no_rekening: "", atas_nama: "", catatan: "", aktif: true },
];
const saluran = [
  { id: "s1", nama: "Shopee", jenis: "marketplace", akun_id: "a2", aktif: true },
  { id: "s2", nama: "Reseller", jenis: "reseller", akun_id: null, aktif: true },
];
const pelanggan = [{ id: "c1", nama: "MANDALAWANGI", kode: "002", alamat: "Desa Wonoharjo", kontak: "", no_wa: "0857", catatan: "", aktif: true }];

function order(id: string, status: string, extra: Record<string, unknown> = {}) {
  return {
    id, no_order: "260922PJ9B35EN", tanggal_order: "2026-09-22", saluran_id: "s2", pelanggan_id: "c1", nama_pembeli: "", produk_id: "p1", qty: 1,
    harga_satuan: "725000", harga_cat_jasa: "220000", jenis_packing: "biasa", harga_packing: "0", biaya_proses: "10000", warna: "hijau sage",
    potongan_marketplace: "0", pemasok_id: "m1", biaya_pokok: "500000", butuh_cat: true, status, tgl_pesan_pemasok: null, tgl_diambil: "2026-09-26",
    tgl_dicat: null, tgl_dikirim: null, tgl_selesai: null, catatan: "", total_penjualan: "955000", laba_kotor: "455000", ...extra,
  };
}

function peta(): Record<string, unknown> {
  return {
    "/auth/me": pengguna,
    "/akun-kas": akun,
    "/kategori": [
      { id: "k1", nama: "Operasional", jenis: "pengeluaran" },
      { id: "k2", nama: "Penjualan marketplace", jenis: "pemasukan" },
    ],
    "/produk": produk,
    "/pemasok": pemasok,
    "/saluran": saluran,
    "/pelanggan": pelanggan,
    "/order": [order("o1", "diambil"), order("o2", "dipesan", { no_order: "X2", pemasok_id: null, butuh_cat: false, warna: "" })],
    "/pembayaran-pemasok/siap": { selasa: "2026-09-29", batas_diambil: "2026-09-26", sudah_dicatat_id: null, total: "0", pemasok: [] },
    "/pembayaran-pemasok": [],
    "/invoice-reseller": [],
    "/penerimaan-reseller": [],
    "/piutang-reseller": [{ pelanggan_id: "c1", nama: "MANDALAWANGI", subtotal: "850000", items: [] }],
    "/sisihan/hitung": {
      selasa: "2026-09-29", periode: "2026-09", minggu_ke: 4, items: [{ jenis: "gaji", nama: "Sari", jumlah: "500000" }], total: "500000",
      saldo_kas_utama: "3400000", cukup: true, sudah_dicatat_id: "sis1", catatan: "",
    },
    "/kas-kecil/pengisian": { akun_id: "a3", plafon: "3000000", saldo: "2850000", perlu_diisi: "150000", saldo_kas_utama: "3400000", cukup: true },
    "/kas-iklan/pengisian": { akun_id: "a5", plafon: "2000000", saldo: "1600000", perlu_diisi: "400000", saldo_kas_utama: "3400000", cukup: true },
    "/karyawan": [{ id: "w1", nama: "Sari", peran: "kas_kecil_packing", gaji_bulanan: "2000000", user_id: null, aktif: true }],
    "/gaji": [],
    "/langganan": [{ id: "l1", nama: "Listrik", jumlah_bulanan: "400000", aktif: true }],
    "/tagihan": [],
    "/bagi-hasil/hitung": { periode: "2026-09", pemasukan: "10000000", pengeluaran: "1900000", laba_bersih: "8100000", persen_admin: "40", persen_owner: "60", bagian_admin: "3240000", bagian_owner: "4860000" },
    "/bagi-hasil": [],
    "/harga-grosir": [],
    "/users": [pengguna],
    "/profil": {
      nama_usaha: "PT. Bumi Lestari Indonesia", alamat: "", telepon: "", email: "", catatan: "", biaya_proses_order: "10000", info_pembayaran: "",
      nama_usaha_lama: "CV. Bumi Lestari Indonesia", nama_usaha_berlaku_mulai: "2026-10-04",
      proporsi_bagi_hasil: [{ id: "i1", penerima: "admin", persen: "40" }, { id: "i2", penerima: "owner", persen: "60" }],
    },
    "/dashboard": {
      periode: "2026-09", selasa: "2026-09-29", akun, total_kas: "6250000", pemasukan_bulan_ini: "0", biaya_bulan_ini: "0", laba_bulan_ini: "0", order_per_status: {},
      order_bulan_ini: 0, omzet_order_bulan_ini: "0", piutang_penjual_lain: "0", utang_pemasok_siap_bayar: "0", dana_cadangan: "0", kas_kecil: null, kas_iklan: null,
      bagian_admin_pratinjau: null, bagian_owner_pratinjau: null,
    },
    "/transaksi": [
      { id: "t1", tanggal: "2026-09-22", akun_id: "a1", kategori_id: "k1", jenis: "keluar", jumlah: "50000", keterangan: "lakban", dibatalkan: false },
    ],
    "/transfer": [
      { id: "tr1", tanggal: "2026-09-22", dari_akun_id: "a2", ke_akun_id: "a1", jumlah: "400000", jenis: "biasa", keterangan: "Tarik saldo toko", dibatalkan: false, alasan_batal: null },
    ],
  };
}

/** Pasang API tiruan pada halaman. Mengembalikan daftar permintaan tulis (POST/PATCH/PUT) yang terjadi. */
export async function pasangApiTiruan(page: Page): Promise<Panggilan[]> {
  const panggilan: Panggilan[] = [];
  const data = peta();
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/api/bumi-lestari/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/bumi-lestari", "");
    if (req.method() !== "GET") {
      let body: unknown = null;
      try {
        body = req.postDataJSON();
      } catch {
        body = req.postData();
      }
      panggilan.push({ metode: req.method(), path, body });
      return json(route, { id: "x" });
    }
    return path in data ? json(route, data[path]) : json(route, { detail: `tidak ada ${path}` }, 404);
  });
  return panggilan;
}
