import type { Page, Route } from "@playwright/test";

/** API Bumi Lestari tiruan untuk tes klik: data tetap, permintaan tulis dicatat di `panggilan`. */
export interface Panggilan {
  metode: string;
  path: string;
  body: unknown;
  /** Query string (mis. "?tanggal=2026-09-29"). */
  cari: string;
}

export type Peran = "admin" | "owner" | "staff";

const PENGGUNA: Record<Peran, { id: string; nama: string; email: string; role: Peran; must_change_password: boolean; aktif: boolean }> = {
  admin: { id: "u1", nama: "Bu Admin", email: "a@t.com", role: "admin", must_change_password: false, aktif: true },
  owner: { id: "u2", nama: "Pak Owner", email: "o@t.com", role: "owner", must_change_password: false, aktif: true },
  staff: { id: "u3", nama: "Sari", email: "s@t.com", role: "staff", must_change_password: false, aktif: true },
};

/** Kategori sesuai seeder backend (tenants/bumi_lestari). */
const kategori = [
  ["k1", "Operasional", "pengeluaran"],
  ["k2", "Penjualan marketplace", "pemasukan"],
  ["k3", "Penjualan toko web", "pemasukan"],
  ["k4", "Penjualan reseller", "pemasukan"],
  ["k5", "Pemasukan lain", "pemasukan"],
  ["k6", "Biaya produksi / pembelian barang", "pengeluaran"],
  ["k7", "Gaji karyawan", "pengeluaran"],
  ["k8", "Bagi hasil", "pengeluaran"],
  ["k9", "Transport", "pengeluaran"],
  ["k10", "Packing", "pengeluaran"],
  ["k11", "Biaya iklan", "pengeluaran"],
  ["k12", "Langganan & utilitas", "pengeluaran"],
  ["k13", "Prive", "pengeluaran"],
  ["k14", "Pengeluaran lain", "pengeluaran"],
  ["k15", "Setoran modal", "pemasukan"],
].map(([id, nama, jenis]) => ({
  id,
  nama,
  jenis,
  // Tanda terhitung dari backend Fase 1 (kategori_core.py).
  sistem: ["Penjualan marketplace", "Penjualan toko web", "Penjualan reseller", "Biaya produksi / pembelian barang", "Gaji karyawan", "Langganan & utilitas", "Bagi hasil"].includes(nama),
  untuk_staf: ["Transport", "Packing", "Operasional", "Pengeluaran lain"].includes(nama),
  khusus_admin: ["Prive", "Setoran modal"].includes(nama),
}));
const akun = [
  { id: "a1", kode: "KAS_UTAMA", nama: "Kas utama", jenis: "kas", plafon: null, saldo: "3400000.00" },
  { id: "a2", kode: "SALDO_SHOPEE", nama: "Saldo Shopee", jenis: "ewallet", plafon: null, saldo: "1250000.00" },
  { id: "a3", kode: "KAS_KECIL", nama: "Kas kecil", jenis: "kas_kecil", plafon: "3000000.00", saldo: "2850000.00", saldo_setelah_draf: "2825000.00" },
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

function invoice() {
  return {
    nomor: "INV-002-260929", minggu: { label: "21–26 Sep 2026", periode_awal: "2026-09-21", periode_akhir: "2026-09-26" },
    tgl_invoice: "2026-09-26", jatuh_tempo: "2026-09-29", kepada: { pelanggan_id: "c1", nama: "MANDALAWANGI", alamat: "Desa Wonoharjo" },
    items: [{ order_id: "o1", tanggal: "2026-09-26", hari: "Sabtu", nama_barang: "Partisi Rak Tengah [2 rak]", ukuran: "150x20x200", qty: 1, harga_barang: "725000", biaya_jasa_pengecatan: "220000", biaya_proses: "0", total: "945000", terlambat: false }],
    total_barang: "725000", total_jasa_pengecatan: "220000", total_biaya_proses: "0", grand_total: "945000",
  };
}

/** Draf belum dikirim: 1 catatan kas kecil. */
const draf = [
  {
    sumber: "kas_kecil", label: "Kas kecil", jumlah_entri: 1, total_masuk: "0", total_keluar: "25000", total: "25000", tanggal_tertua: "2026-09-23",
    entri: [{ ref_jenis: "transaksi", ref_id: "t3", tanggal: "2026-09-23", jenis: "keluar", jumlah: "25000", keterangan: "lakban packing" }],
  },
];
function kiriman(id: string, extra: Record<string, unknown> = {}) {
  return {
    id, nomor: "KRM-20260922-001", sumber: "kas_kecil", sampai_tanggal: null, jumlah_entri: 1, total: "40000", status: "terkirim",
    dikirim_oleh: "u1", dikirim_pada: "2026-09-22T09:00:00Z", dibatalkan_oleh: null, dibatalkan_pada: null, alasan_batal: null, tutup_kas_mingguan_id: null, ...extra,
  };
}

/** Balasan permintaan tulis yang isinya dipakai layar (selain itu {id: "x"}). */
const BALASAN_TULIS: Record<string, unknown> = {
  "/kiriman": kiriman("krbaru", { nomor: "KRM-20260929-001", total: "25000" }),
  "/kiriman/semua": [kiriman("krbaru", { nomor: "KRM-20260929-001", total: "25000" })],
};

function peta(pengguna: (typeof PENGGUNA)[Peran]): Record<string, unknown> {
  return {
    "/auth/me": pengguna,
    "/akun-kas": akun,
    "/kategori": kategori,
    "/produk": produk,
    "/pemasok": pemasok,
    "/saluran": saluran,
    "/pelanggan": pelanggan,
    "/order": [order("o1", "diambil"), order("o2", "dipesan", { no_order: "X2", pemasok_id: null, butuh_cat: false, warna: "" })],
    "/pembayaran-pemasok/siap": {
      selasa: "2026-09-29", batas_diambil: "2026-09-26", sudah_dicatat_id: null, total: "500000",
      pemasok: [{ pemasok_id: "m1", nama: "AHMAD NUR ALIM", jenis: "tukang_kayu", subtotal: "500000", items: [{ order_id: "o1", no_order: "260922PJ9B35EN", produk_id: "p1", qty: 1, tgl_diambil: "2026-09-26", jumlah: "500000", terlambat: false }] }],
    },
    "/pembayaran-pemasok": [],
    "/invoice-reseller": [invoice()],
    "/penerimaan-reseller": [],
    "/piutang-reseller": [{ pelanggan_id: "c1", nama: "MANDALAWANGI", subtotal: "1795000", items: [] }],
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
    "/users": [PENGGUNA.admin],
    "/profil": {
      nama_usaha: "PT. Bumi Lestari Indonesia", alamat: "", telepon: "", email: "", catatan: "", biaya_proses_order: "10000", info_pembayaran: "",
      nama_usaha_lama: "CV. Bumi Lestari Indonesia", nama_usaha_berlaku_mulai: "2026-10-04",
      proporsi_bagi_hasil: [{ id: "i1", penerima: "admin", persen: "40" }, { id: "i2", penerima: "owner", persen: "60" }],
    },
    "/dashboard": {
      periode: "2026-09", selasa: "2026-09-29", akun, total_kas: "10100000", pemasukan_bulan_ini: "0", biaya_bulan_ini: "0", laba_bulan_ini: "0",
      order_per_status: { diambil: 1, dipesan: 1 }, order_bulan_ini: 2, omzet_order_bulan_ini: "1910000", piutang_penjual_lain: "1795000",
      utang_pemasok_siap_bayar: "500000", dana_cadangan: "1000000",
      kas_kecil: { saldo: "2850000", plafon: "3000000", perlu_diisi: "150000" }, kas_iklan: { saldo: "300000", plafon: "2000000", perlu_diisi: "1700000" },
      bagian_admin_pratinjau: null, bagian_owner_pratinjau: null, draf_belum_dikirim: draf,
    },
    "/kiriman/draf": draf,
    "/kiriman": [
      kiriman("kr1"),
      kiriman("kr0", { nomor: "KRM-20260915-001", status: "dibatalkan", dibatalkan_oleh: "u1", dibatalkan_pada: "2026-09-16T02:00:00Z", alasan_batal: "salah jumlah" }),
    ],
    "/transaksi": [
      { id: "t1", tanggal: "2026-09-22", akun_id: "a1", kategori_id: "k1", jenis: "keluar", jumlah: "50000", keterangan: "lakban", dibatalkan: false, ref_jenis: null, ref_id: null, status_kirim: "terkirim", kiriman_id: null },
      { id: "t2", tanggal: "2026-09-22", akun_id: "a1", kategori_id: "k6", jenis: "keluar", jumlah: "500000", keterangan: "Bayar tukang & supplier Selasa 22/09", dibatalkan: false, ref_jenis: "pembayaran_pemasok", ref_id: "pp1", status_kirim: "terkirim", kiriman_id: "kr2" },
      { id: "t3", tanggal: "2026-09-23", akun_id: "a3", kategori_id: "k10", jenis: "keluar", jumlah: "25000", keterangan: "lakban packing", dibatalkan: false, ref_jenis: null, ref_id: null, status_kirim: "draf", kiriman_id: null },
      { id: "t4", tanggal: "2026-09-21", akun_id: "a3", kategori_id: "k9", jenis: "keluar", jumlah: "40000", keterangan: "ojek kirim barang", dibatalkan: false, ref_jenis: null, ref_id: null, status_kirim: "terkirim", kiriman_id: "kr1" },
    ],
    "/transfer": [
      { id: "tr1", tanggal: "2026-09-22", dari_akun_id: "a2", ke_akun_id: "a1", jumlah: "400000", jenis: "biasa", keterangan: "Tarik saldo toko", dibatalkan: false, alasan_batal: null },
      { id: "tr2", tanggal: "2026-09-22", dari_akun_id: "a1", ke_akun_id: "a4", jumlah: "500000", jenis: "sisihan_dana", keterangan: "Sisihan gaji", dibatalkan: false, alasan_batal: null },
    ],
    "/laporan/kas-kecil": {
      periode: "2026-09", nama: "Kas kecil", plafon: "3000000", saldo_awal: "3000000", total_pemakaian: "25000", total_pengisian: "0", saldo_akhir: "2975000", sesuai_plafon: true,
      per_kategori: [{ kategori: "Packing", jumlah: "25000", jumlah_transaksi: 1 }], per_minggu: [],
      transaksi: [{ tanggal: "2026-09-23", kategori: "Packing", keterangan: "lakban packing", jumlah: "25000" }], pengisian: [], saldo_fisik: null, selisih: null, status_selisih: null,
    },
  };
}

export interface OpsiTiruan {
  peran?: Peran;
  /** Ganti/tambah respons GET per path. */
  data?: Record<string, unknown>;
  /** Paksa permintaan tulis ke path tertentu gagal dengan pesan backend apa adanya. */
  galat?: Record<string, { status: number; detail: string; sekali?: boolean }>;
  /** Ganti balasan permintaan tulis per path. */
  balasan?: Record<string, unknown>;
}

/** Pasang API tiruan pada halaman. Mengembalikan daftar permintaan tulis (POST/PATCH/PUT) yang terjadi. */
export async function pasangApiTiruan(page: Page, opsi: OpsiTiruan = {}): Promise<Panggilan[]> {
  const panggilan: Panggilan[] = [];
  const data = { ...peta(PENGGUNA[opsi.peran ?? "admin"]), ...opsi.data };
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  await page.route("**/api/bumi-lestari/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/bumi-lestari", "");
    if (req.method() !== "GET") {
      let body: unknown = null;
      try {
        body = req.postDataJSON();
      } catch {
        body = req.postData();
      }
      panggilan.push({ metode: req.method(), path, body, cari: url.search });
      const g = opsi.galat?.[path];
      if (g) {
        if (g.sekali) delete opsi.galat![path];
        return json(route, { detail: g.detail }, g.status);
      }
      return json(route, opsi.balasan?.[path] ?? BALASAN_TULIS[path] ?? { id: "x" });
    }
    return path in data ? json(route, data[path]) : json(route, { detail: `tidak ada ${path}` }, 404);
  });
  return panggilan;
}
