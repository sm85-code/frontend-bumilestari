import { test } from "@playwright/test";
test.skip(true, "layar lama diganti");
import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, hp, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2.4/2.5: pencairan dari file penghasilan + format file penghasilan di Data master. */

const kolomShopee = [
  { kolom_tujuan: "kode_pesanan", kolom_sumber: "No. Pesanan", operasi: "ambil", nama_rincian: null },
  { kolom_tujuan: "tanggal_cair", kolom_sumber: "Tanggal Dana Dilepaskan", operasi: "ambil", nama_rincian: null },
  { kolom_tujuan: "jumlah_cair", kolom_sumber: "Total Penghasilan", operasi: "ambil", nama_rincian: null },
];
const format = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id, saluran_id: "s1", nama: "Penghasilan Saya", versi: 1, status, jenis_file: "xlsx", nama_sheet: null, baris_header: 1, baris_data_mulai: null,
  format_tanggal: "yyyy-mm-dd", pemisah_desimal: ",", pemisah_ribuan: ".", aturan_tanda: "mutlak", aturan_jenis_baris: {}, satuan_baris: "per_pesanan",
  aturan_abaikan: {}, catatan: "", contoh_nama: null, hasil_uji: null, lulus_uji: false, diaktifkan_pada: null, created_at: "2026-09-01T00:00:00Z", kolom: kolomShopee, ...extra,
});
const baris = (kode: string, kelompok: string, cair: string, alasan = "") => ({
  baris_file: 2, kode_pesanan: kode, tanggal_cair: "2026-09-28", harga_jual: "100000", potongan_biaya: "10000", rincian_biaya: {}, jumlah_cair: cair,
  jenis_baris: "pesanan", mode_catat: "bruto", catatan: [], kelompok, order_id: kelompok === "tidak_cocok" ? null : "o3", perkiraan_cair: "90000", selisih: "0", alasan,
});
const kosong = { jumlah: 0, total_cair: "0" };
const pratinjau = {
  saluran_id: "s1", format_id: "f1", format_versi: 1, nama_file: "shopee.xlsx", bermasalah: 1, jumlah_disimpan: 2, total_dibukukan: "90000", neto: false,
  kelompok: { cocok: { jumlah: 1, total_cair: "90000" }, selisih: kosong, tidak_cocok: { jumlah: 1, total_cair: "50000" }, duplikat: kosong, penyesuaian: kosong },
  baris: [baris("SHP-777", "cocok", "90000"), { ...baris("SHP-999", "tidak_cocok", "50000", "Order tidak ditemukan; disimpan menunggu"), baris_file: 3 }],
  masalah: [{ baris: 4, kolom: "Total Penghasilan", nilai: "abc", alasan: "bukan angka" }],
};
const unggahan = {
  id: "u1", saluran_id: "s1", format_id: "f1", format_versi: 1, nama_file: "shopee-sept.xlsx", tanggal: "2026-09-28", periode_dari: null, periode_sampai: null,
  jumlah_baris: 2, total: "140000", total_harga_jual: "200000", total_potongan: "20000", status_kirim: "draf", kiriman_id: null, diunggah_oleh: "u2",
  dibatalkan: false, alasan_batal: null, created_at: "2026-09-28T03:00:00Z",
};
const barisSimpan = (id: string, kode: string, status: string) => ({
  id, kode_pesanan: kode, tanggal_cair: "2026-09-28", harga_jual: "100000", potongan_biaya: "10000", rincian_biaya: {}, jumlah_cair: "70000", jenis_baris: "pesanan",
  mode_catat: "bruto", order_id: status === "tidak_cocok" ? null : "o3", status_cocok: status, selisih: "0", baris_file: 2, masalah: null, dibatalkan: false,
});
const belumCair = {
  per_tanggal: "2026-10-04", total_penjualan: "100000", total_perkiraan_cair: "90000", jumlah_order: 1,
  per_saluran: [{ saluran_id: "s1", nama: "Shopee", akun_id: "a2", jumlah_order: 1, total_penjualan: "100000", total_perkiraan_cair: "90000", tgl_kirim_tertua: "2026-09-24",
    order: [{ order_id: "o9", no_order: "SHP-999X", tgl_dikirim: "2026-09-24", penjualan: "100000", potongan: "10000", perkiraan_cair: "90000", status: "dikirim" }] }],
};
const file = { name: "shopee.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from("PK tiruan") };

test("pencairan: unggah file, pratinjau per kelompok, simpan sebagai draf", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, {
    peran: "owner",
    data: { "/format-penghasilan": [format("f1", "aktif", { lulus_uji: true })], "/pencairan": [] },
    balasan: { "/pencairan/pratinjau": pratinjau, "/pencairan": unggahan },
  });
  await page.goto("/pencairan");
  await expect(page.getByText("Format: Penghasilan Saya (versi 1)")).toBeVisible();
  await page.getByLabel("File penghasilan").setInputFiles(file);
  await page.getByRole("button", { name: "Pratinjau" }).click();
  await expect(page.getByText("SHP-999")).toBeVisible();
  await expect(page.getByText("Order tidak ditemukan; disimpan menunggu")).toBeVisible();
  await expect(page.locator("[data-masalah]")).toContainText('Baris 4, kolom "Total Penghasilan": bukan angka');
  await page.getByRole("button", { name: "Simpan pencairan" }).click();
  await expect.poll(() => panggilan.filter((p) => p.path === "/pencairan" && p.metode === "POST").length).toBe(1);
  const kirim = panggilan.find((p) => p.path === "/pencairan")!;
  expect(String(kirim.body)).toContain('name="saluran_id"');
  await expect(page.getByText("SHP-999")).toHaveCount(0); // pratinjau ditutup setelah disimpan
});

test("pencairan: tanpa format aktif diarahkan ke Data master", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "owner", data: { "/format-penghasilan": [format("f1", "draf")], "/pencairan": [] } });
  await page.goto("/pencairan");
  await expect(page.getByText(/Ada draf "Penghasilan Saya" \(versi 1\); uji dengan file asli lalu aktifkan/)).toBeVisible();
  await expect(page.getByLabel("File penghasilan")).toHaveCount(0);
});

test("pencairan: rincian riwayat, hubungkan baris menunggu ke order, batalkan unggahan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, {
    peran: "owner",
    data: {
      "/format-penghasilan": [format("f1", "aktif")],
      "/pencairan": [unggahan],
      "/pencairan/u1": { ...unggahan, baris: [barisSimpan("b1", "SHP-777", "cocok"), barisSimpan("b2", "SHP-999", "tidak_cocok")] },
      "/laporan/belum-cair": belumCair,
    },
  });
  await page.goto("/pencairan");
  await page.getByRole("button", { name: "Rincian" }).click();
  const dlg = page.locator(".ant-modal").filter({ hasText: "Rincian shopee-sept.xlsx" });
  await expect(dlg.getByText("Menunggu order")).toBeVisible();
  await dlg.getByRole("button", { name: "Hubungkan" }).click();
  const tanya = await dialogKonfirmasi(page);
  await tanya.getByRole("textbox").fill("shp-999x");
  await tanya.getByRole("button", { name: "Hubungkan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/pencairan/baris/b2/hubungkan")).toEqual({ order_id: "o9" });
  await expect(page.locator(".ant-modal-confirm")).toHaveCount(0);
  await dlg.locator(".ant-modal-close").click();
  await expect(dlg).toBeHidden();
  await page.getByRole("button", { name: "Batalkan" }).first().click();
  const batal = await dialogKonfirmasi(page);
  await batal.getByRole("textbox").fill("file salah bulan");
  await batal.getByRole("button", { name: "Batalkan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/pencairan/u1/batal")).toEqual({ alasan: "file salah bulan" });
});

test("data master: format file penghasilan — baca header, petakan kolom, simpan draf, uji, aktifkan", async ({ page }, info) => {
  test.skip(hp(info.project.name), "Di HP tab yang tidak muat berpindah ke menu '…' (perilaku bawaan antd).");
  // Format file penghasilan ada di tab Saluran (khusus admin), di bawah daftar saluran.
  const panggilan = await pasangApiTiruan(page, {
    data: { "/format-penghasilan": [format("f1", "draf", { catatan: "SEMENTARA: uji dengan file asli.", lulus_uji: true })] },
    balasan: {
      "/format-penghasilan/baca-header": {
        sheets: ["Income"], nama_sheet: "Income", baris_header: 1, kolom: ["No. Pesanan", "Tanggal Dana Dilepaskan", "Total Penghasilan", "Biaya Admin"], contoh: [],
        saran: { kode_pesanan: "No. Pesanan", tanggal_cair: "Tanggal Dana Dilepaskan", jumlah_cair: "Total Penghasilan", potongan_biaya: "Biaya Admin" },
      },
      "/format-penghasilan/f1/uji": { lulus: true, jumlah_sah: 2, jumlah_masalah: 0, total_cair: "140000", neto: true, baris: [baris("SHP-777", "cocok", "90000")], masalah: [] },
      "/format-penghasilan/f1": format("f1", "draf"),
      "/format-penghasilan/f1/aktifkan": format("f1", "aktif"),
    },
  });
  await page.goto("/master");
  await page.getByRole("tab", { name: "Saluran" }).click();
  await expect(page.getByText("Catatan Penghasilan Saya v1: SEMENTARA: uji dengan file asli.")).toBeVisible();

  const barisFormat = page.getByRole("row", { name: /Penghasilan Saya/ });
  await barisFormat.getByRole("button", { name: "Uji file" }).click();
  await page.getByLabel("File uji").setInputFiles(file);
  await expect(page.locator("[data-hasil-uji]")).toContainText("Lulus: 2 baris sah, 0 masalah");

  await barisFormat.getByRole("button", { name: "Ubah" }).click();
  await page.getByLabel("Contoh file").setInputFiles(file);
  await expect(page.getByText("4 kolom terbaca di baris 1.")).toBeVisible();
  await page.getByRole("button", { name: "Tambah kolom" }).click();
  await page.getByLabel("Kolom file 4").click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "Biaya Admin" }).click();
  await page.getByLabel("Nama rincian 4").fill("Biaya admin");
  await page.getByRole("button", { name: "Simpan draf" }).click();
  const body = (await tulisanTerkirim(panggilan, "PUT", "/format-penghasilan/f1")) as { nama_sheet: string; kolom: { kolom_tujuan: string; kolom_sumber: string; nama_rincian: string | null }[] };
  expect(body.nama_sheet).toBe("Income");
  expect(body.kolom).toContainEqual({ kolom_tujuan: "potongan_biaya", kolom_sumber: "Biaya Admin", operasi: "jumlahkan", nama_rincian: "Biaya admin" });

  await barisFormat.getByRole("button", { name: "Aktifkan" }).click();
  await (await dialogKonfirmasi(page)).getByRole("button", { name: "Aktifkan" }).click();
  await tulisanTerkirim(panggilan, "POST", "/format-penghasilan/f1/aktifkan");
});
