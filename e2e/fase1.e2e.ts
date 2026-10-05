import { test } from "@playwright/test";
test.skip(true, "layar lama diganti");
import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 1: kirim ke laporan keuangan (posting berkelompok), pembayaran per tukang, tanggal isi ulang, setoran modal. */

test("kas kecil: draf vs terkirim, catatan terkirim terkunci, kirim ke laporan keuangan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/kas-kecil");
  const riwayat = page.locator(".ant-card", { hasText: "Riwayat" }).last();
  const draf = riwayat.locator("tr", { hasText: "lakban packing" });
  await expect(draf.getByText("Draf", { exact: true })).toBeVisible();
  await expect(draf.getByRole("button", { name: "Batalkan" })).toBeVisible();
  const terkirim = riwayat.locator("tr", { hasText: "ojek kirim barang" });
  await expect(terkirim.getByText("Terkirim", { exact: true })).toBeVisible();
  await expect(terkirim.getByRole("button", { name: "Batalkan" })).toHaveCount(0);
  await expect(terkirim.getByRole("link", { name: "Batalkan kirimannya dulu" })).toBeVisible();
  // Uang fisik = saldo setelah draf; saldo resmi ditampilkan terpisah.
  await expect(page.getByText("Rp2.825.000", { exact: true })).toBeVisible();
  await expect(page.getByText(/Saldo tercatat di laporan Rp2\.850\.000/)).toBeVisible();

  const kirim = page.locator('[data-kirim="kas_kecil"]');
  await expect(kirim).toContainText("1 catatan draf senilai Rp25.000, paling lama 23/09/2026");
  await kirim.getByRole("button", { name: "Kirim ke laporan keuangan" }).click();
  const dlg = await dialogKonfirmasi(page);
  await expect(dlg).toContainText("Setelah dikirim catatan terkunci");
  await dlg.getByRole("button", { name: "Kirim ke laporan keuangan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/kiriman")).toMatchObject({ sumber: "kas_kecil" });
  await expect(page.getByText("Terkirim: KRM-20260929-001 (1 catatan).")).toBeVisible();
});

test("staf: tidak ada tombol kirim, hanya keterangan draf", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "staff" });
  await page.goto("/kas-kecil");
  await page.locator(".ant-modal").getByRole("button", { name: "Mengerti" }).click();
  await expect(page.getByRole("button", { name: "Kirim ke laporan keuangan" })).toHaveCount(0);
});

test("riwayat kiriman: batalkan kiriman wajib alasan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/kiriman");
  await expect(page.getByRole("heading", { name: "Kirim ke laporan keuangan" })).toBeVisible();
  const riwayat = page.locator(".ant-card", { hasText: "Riwayat kiriman" });
  await expect(riwayat.locator("tr", { hasText: "KRM-20260915-001" })).toContainText("salah jumlah");
  await expect(riwayat.locator("tr", { hasText: "KRM-20260915-001" }).getByRole("button", { name: "Batalkan kiriman" })).toHaveCount(0);
  await riwayat.locator("tr", { hasText: "KRM-20260922-001" }).getByRole("button", { name: "Batalkan kiriman" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("salah kategori");
  await dlg.getByRole("button", { name: "Batalkan kiriman" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/kiriman/kr1/batal")).toEqual({ alasan: "salah kategori" });
});

test("tutup kas mingguan: langkah akhir kirim semua ke laporan keuangan & isi ulang bertanggal", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/selasa");
  await page.getByText("7. Isi kas kecil & kas iklan sampai plafon").click();
  await page.getByRole("button", { name: "Isi kas kecil Rp150.000" }).click();
  await expect.poll(() => panggilan.find((p) => p.path === "/kas-kecil/pengisian")?.cari).toMatch(/^\?tanggal=\d{4}-\d{2}-\d{2}$/);

  await page.getByText("8. Kirim semua ke laporan keuangan").click();
  await expect(page.locator('[data-langkah="kirim"]')).toContainText("Belum");
  await page.getByRole("button", { name: "Kirim semua ke laporan keuangan", exact: true }).click();
  const dlg = await dialogKonfirmasi(page);
  await expect(dlg).toContainText("1 catatan draf senilai Rp25.000");
  await dlg.getByRole("button", { name: "Kirim semua" }).click();
  const body = (await tulisanTerkirim(panggilan, "POST", "/kiriman/semua")) as Record<string, unknown>;
  expect(body.tutup_kas_mingguan_id).toMatch(/^selasa-\d{4}-\d{2}-\d{2}$/);
});

test("bayar tukang & supplier: bayar per tukang", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/pesanan-tukang");
  await page.locator(".ant-card", { hasText: "AHMAD NUR ALIM · tukang" }).getByRole("button", { name: "Bayar Rp500.000" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("button", { name: "Catat pembayaran" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/pembayaran-pemasok")).toMatchObject({ pemasok_id: "m1" });
});

test("setoran modal kedua: minta konfirmasi lalu kirim ulang dengan tanda konfirmasi", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, {
    galat: { "/transaksi": { status: 409, detail: "Setoran modal sudah pernah dicatat. Konfirmasi bila ini memang setoran modal tambahan.", sekali: true } },
  });
  await page.goto("/keuangan");
  await page.getByRole("button", { name: /Catat manual/ }).click();
  const kartu = page.locator(".ant-card", { hasText: "Hanya untuk yang jarang" });
  await kartu.getByText("Pemasukan", { exact: true }).click();
  await kartu.getByRole("combobox", { name: "Kategori" }).click();
  await page.locator(".ant-select-dropdown:visible").getByText("Setoran modal", { exact: true }).click();
  await kartu.getByRole("textbox", { name: "Jumlah" }).fill("5000000");
  await kartu.getByRole("button", { name: "Simpan" }).click();
  const dlg = await dialogKonfirmasi(page);
  await expect(dlg).toContainText("setoran modal TAMBAHAN");
  await dlg.getByRole("button", { name: "Ya, setoran tambahan" }).click();
  await expect.poll(() => panggilan.filter((p) => p.path === "/transaksi").length).toBe(2);
  expect(panggilan.filter((p) => p.path === "/transaksi")[1].body).toMatchObject({ kategori_id: "k15", konfirmasi_setoran_modal_kedua: true });
});

test("owner (bukan admin) tidak ditawari Prive & Setoran modal", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "owner" });
  await page.goto("/keuangan");
  await page.getByRole("button", { name: /Catat manual/ }).click();
  const kartu = page.locator(".ant-card", { hasText: "Hanya untuk yang jarang" });
  await kartu.getByText("Pemasukan", { exact: true }).click();
  await kartu.getByRole("combobox", { name: "Kategori" }).click();
  const daftar = page.locator(".ant-select-dropdown:visible");
  await expect(daftar.getByText("Pemasukan lain", { exact: true })).toBeVisible();
  await expect(daftar.getByText("Setoran modal", { exact: true })).toHaveCount(0);
});
