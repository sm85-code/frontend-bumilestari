export function keuFixtures() {
  const page = (rows: unknown[]) => ({ rows, total: rows.length, limit: 50, offset: 0 });
  const channels = [{ id: "s", nama: "Manual", sistem: "manual", akun_ref: "manual", aktif: true }, { id: "erp", nama: "ERP Test", sistem: "marketplace_erp", akun_ref: "erp-account", aktif: true }];
  const products = [{ id: "p", nama: "Kayu Test", sku: "TEST", sku_induk: "PARENT", nama_asli: "Kayu Test nama panjang", gambar_url: "", varian_list: [], harga_jual: "10.00", status: "master", jenis: "kayu", biaya_acuan: "5.00", aktif: true }];
  const item = { id: "i", pesanan_id: "o", sumber_ref: "item-test", produk_id: "p", nama_snapshot: "Kayu Test", varian_snapshot: "", qty: 2, harga_satuan: "10.00", subtotal_sumber: "20.00" };
  return {
    "/keu/buku": { aktif: false, pengaturan: null },
    "/keu/dashboard": { saldo_kas: "9007199254740993.01", kas_masuk: "18.00", kas_keluar: "0.00", nilai_pesanan: "20.00", biaya_vendor: "0.00", pesanan: 1, belum_dipetakan: 0, settlement_draf: 1, masukan_gagal: 0 },
    "/keu/saluran": page(channels), "/keu/produk": page(products), "/keu/akun": page([{ id: "a", nama: "Kas", kode: "KAS", jenis: "kas", saldo_awal: "0.00", aktif: true }]), "/keu/pelanggan": page([]),
    "/keu/kategori": [{ id: "income", nama: "Penjualan", jenis: "pemasukan" }, { id: "expense", nama: "Operasional", jenis: "pengeluaran" }],
    "/keu/sumber": { erp: [{ id: "erp-account", nama: "ERP Test" }], erp_tersedia: true, store_tersedia: true },
    "/keu/vendor": page([{ id: "v", kode: "VENDOR-1", nama: "Vendor Test", tipe: "kayu", jenis: "tukang_kayu", kontak: "", alamat: "", keterangan: "", aktif: true, status: "aktif" }]),
    "/keu/pesanan": page([{ id: "o", saluran_id: "s", nomor: "TEST-1", tanggal: "2026-10-06", status: "draf", status_sumber: "manual", total_sumber: "20.00", items: [item] }]), "/keu/item": page([item]),
    "/keu/settlement": page([{ id: "st", saluran_id: "s", sumber_ref: "SET-1", tanggal_cair: "2026-10-06", bruto: "20.00", potongan: "2.00", penyesuaian: "0.00", neto: "18.00", status: "draf" }]),
    "/keu/alokasi-settlement": page([]), "/keu/alokasi-vendor": page([]), "/keu/transaksi": page([]), "/keu/impor": page([]), "/keu/masukan": page([]),
  };
}
