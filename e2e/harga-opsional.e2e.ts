import { expect, test } from "@playwright/test";
import { tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Harga jual produk opsional (harga acuan), harga order mengikuti file penghasilan untuk marketplace,
   margin produk tanpa biaya proses, dan Catat manual pencairan untuk semua saluran marketplace. */

const produkTanpaHarga = { id: "p3", sku: "RAK-01", nama: "Rak Dinding", jenis_produk: "kayu", ukuran: "", harga_jual: null, biaya_pokok_default: "300000", aktif: true };
const formatAktif = {
  id: "f1", saluran_id: "s1", nama: "Penghasilan Saya", versi: 1, status: "aktif", jenis_file: "xlsx", nama_sheet: null, baris_header: 1, baris_data_mulai: null,
  format_tanggal: "yyyy-mm-dd", pemisah_desimal: ",", pemisah_ribuan: ".", aturan_tanda: "mutlak", aturan_jenis_baris: {}, satuan_baris: "per_pesanan",
  aturan_abaikan: {}, catatan: "", contoh_nama: null, hasil_uji: null, lulus_uji: true, diaktifkan_pada: null, created_at: "2026-09-01T00:00:00Z", kolom: [],
};

test("produk: harga acuan opsional, tabel menampilkan — bila kosong", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, { data: { "/produk": [produkTanpaHarga] } });
  await page.goto("/master");
  await expect(page.getByRole("columnheader", { name: "Harga acuan" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Harga beli" })).toBeVisible();
  await expect(page.getByRole("row", { name: /RAK-01/ })).toContainText("—");
  await page.getByRole("button", { name: /Produk/ }).first().click();
  const dlg = page.locator(".ant-modal").filter({ hasText: "Produk baru" });
  await expect(dlg.getByText("Harga acuan (opsional)")).toBeVisible();
  await expect(dlg.getByText("Untuk marketplace, harga final mengikuti file penghasilan.")).toBeVisible();
  await expect(dlg.getByText("Harga beli (Rp)")).toBeVisible();
  await expect(dlg.getByText("Harga barang + jasa tukang/supplier (total yang dibayar untuk 1 barang siap jual)")).toBeVisible();
  await dlg.getByLabel("SKU").fill("LMR-01");
  await dlg.getByLabel("Nama barang").fill("Lemari");
  await dlg.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/produk")).toMatchObject({ sku: "LMR-01", nama: "Lemari", harga_jual: null });
});

test("order baru: marketplace harga opsional (mengikuti file), penjual lain memakai harga grosir", async ({ page }) => {
  await pasangApiTiruan(page, {
    data: { "/harga-grosir": [{ id: "g1", produk_id: "p1", pelanggan_id: "c1", harga: "725000", harga_cat_jasa: "220000", harga_packing_biasa: "0", harga_packing_kayu: "0" }] },
  });
  await page.goto("/order");
  await page.getByRole("button", { name: /Order baru/ }).click();
  const dlg = page.locator(".ant-modal");
  await expect(dlg.getByText("Harga barang per unit (opsional)")).toBeVisible();
  await expect(dlg.getByText("Harga mengikuti file penghasilan")).toBeVisible();

  await dlg.locator(".ant-select").first().click();
  await expect(page.locator(".ant-select-dropdown:visible")).toBeVisible();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "Reseller" }).click();
  await expect(dlg.locator(".ant-select").first()).toContainText("Reseller");
  await expect(dlg.getByText("Harga mengikuti file penghasilan")).toHaveCount(0);
  await dlg.locator(".ant-select").nth(1).click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "MANDALAWANGI" }).click();
  await expect(dlg.getByText("Kosong = harga grosir Rp725.000")).toBeVisible();
});

test("pencairan: Catat manual untuk Shopee (bruto, draf)", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, { peran: "owner", data: { "/format-penghasilan": [formatAktif], "/pencairan": [] } });
  await page.goto("/pencairan");
  await expect(page.getByRole("button", { name: "Impor file" })).toBeVisible();
  await expect(page.getByText("Untuk masa transisi atau bila file belum ada")).toBeVisible();
  await page.getByRole("button", { name: "Catat manual" }).click();
  await page.getByLabel("Kode pesanan").fill("SHP-5");
  await page.getByLabel("Harga jual").fill("900.000");
  await page.getByLabel("Potongan biaya").fill("60000");
  await expect(page.getByText("Kosong = harga jual − potongan (Rp840.000)")).toBeVisible();
  await page.getByRole("button", { name: "Simpan pencairan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/pencairan/manual")).toMatchObject({
    saluran_id: "s1", kode_pesanan: "SHP-5", harga_jual: "900000", potongan: "60000", jumlah_cair: null,
  });
});

test("pencairan: impor file melewati order yang sudah dicatat manual, bisa diganti bila masih draf", async ({ page }) => {
  const kosong = { jumlah: 0, total_cair: "0" };
  const baris = (kode: string, kelompok: string, extra: Record<string, unknown> = {}) => ({
    baris_file: 2, kode_pesanan: kode, tanggal_cair: "2026-10-02", harga_jual: "850000", potongan_biaya: "50000", rincian_biaya: {}, jumlah_cair: "800000",
    jenis_baris: "pesanan", mode_catat: "bruto", catatan: [], kelompok, order_id: "o3", perkiraan_cair: "800000", selisih: "0", alasan: "", ...extra,
  });
  const pratinjau = {
    saluran_id: "s1", format_id: "f1", format_versi: 1, nama_file: "okt.xlsx", bermasalah: 0, jumlah_disimpan: 1, total_dibukukan: "800000", neto: false,
    kelompok: { cocok: { jumlah: 1, total_cair: "800000" }, selisih: kosong, tidak_cocok: kosong, duplikat: { jumlah: 1, total_cair: "800000" }, penyesuaian: kosong },
    baris: [baris("SHP-1", "duplikat", { baris_file: 3, alasan: "sudah dicatat manual", dicatat_manual: true, manual_unggahan_id: "um1", manual_bisa_diganti: true }), baris("SHP-2", "cocok")],
    masalah: [], sudah_manual: 1, manual_bisa_diganti: 1,
  };
  const panggilan = await pasangApiTiruan(page, {
    peran: "owner",
    data: { "/format-penghasilan": [formatAktif], "/pencairan": [] },
    balasan: { "/pencairan/pratinjau": pratinjau, "/pencairan": { id: "u9" } },
  });
  await page.goto("/pencairan");
  await page.getByLabel("File penghasilan").setInputFiles({ name: "okt.xlsx", mimeType: "application/octet-stream", buffer: Buffer.from("PK tiruan") });
  await page.getByRole("button", { name: "Pratinjau" }).click();
  await expect(page.getByText("Sudah dicatat manual", { exact: true })).toBeVisible();
  await expect(page.locator("[data-sudah-manual]")).toContainText("1 baris sudah dicatat manual dan dilewati");
  await page.getByText("Ganti 1 entri manual yang masih draf dengan isi file ini").click();
  await page.getByRole("button", { name: "Simpan pencairan" }).click();
  const body = String(await tulisanTerkirim(panggilan, "POST", "/pencairan"));
  expect(body).toContain('name="ganti_manual"');
});

test("HPP & margin: pendapatan biaya proses tampil terpisah", async ({ page }) => {
  const m = {
    label: "Total", qty: 1, jumlah_order: 1, penjualan: "900000", potongan: "60000", hpp: "300000", laba_kotor: "540000", margin_persen: "60.0",
    margin_kotor: "600000", margin_kotor_persen: "66.7", biaya_proses: "10000",
  };
  await pasangApiTiruan(page, {
    data: { "/laporan/hpp-margin": { periode: "2026-09", sementara: false, per_produk: [{ ...m, label: "Partisi" }], per_saluran: [{ ...m, label: "Penjual lain" }], total: m, pendapatan_biaya_proses: "10000" } },
  });
  await page.goto("/laporan");
  await page.getByRole("tab", { name: "HPP & margin" }).click();
  await expect(page.locator("[data-biaya-proses]")).toContainText("Pendapatan biaya proses");
  await expect(page.locator("[data-biaya-proses]")).toContainText("Rp10.000");
  const margin = page.locator("[data-margin]");
  for (const t of ["Penjualan produk", "Harga beli", "Margin kotor", "Potongan marketplace", "Margin bersih saluran", "66,7%", "60%"]) await expect(margin).toContainText(t);
  await expect(margin).toContainText("margin kotor Rp600.000 · margin bersih saluran Rp540.000");
});

test("data master: tab Tukang dan Supplier terpisah, tambah dengan jenis otomatis", async ({ page }, info) => {
  test.skip(info.project.name === "hp", "Di HP tab yang tidak muat berpindah ke menu '…' (perilaku bawaan antd).");
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/master");
  await page.getByRole("tab", { name: "Tukang", exact: true }).click();
  await expect(page.getByRole("cell", { name: "AHMAD NUR ALIM" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Toko Lampu" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Supplier", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Toko Lampu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "AHMAD NUR ALIM" })).toHaveCount(0);
  await page.getByRole("button", { name: /Supplier/ }).first().click();
  const dlg = page.locator(".ant-modal").filter({ hasText: "Supplier baru" });
  await dlg.getByLabel("Nama").fill("Toko Cat Jaya");
  await dlg.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/pemasok")).toMatchObject({ nama: "Toko Cat Jaya", jenis: "supplier" });
});
