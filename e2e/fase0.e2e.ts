import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 0: alur keuangan & menu (FE saja, API tiruan). */

test("kas & transaksi: kategori kosong di awal, kategori sistem tidak bisa dipilih", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/keuangan");
  await page.getByRole("button", { name: /Catat manual/ }).click();
  const kartu = page.locator(".ant-card", { hasText: "Hanya untuk yang jarang" });
  await expect(kartu.getByText("Pilih kategori", { exact: true })).toBeVisible();
  await expect(kartu.getByRole("button", { name: "Simpan" })).toBeDisabled();
  await kartu.getByRole("combobox", { name: "Kategori" }).click();
  const daftar = page.locator(".ant-select-dropdown:visible");
  await expect(daftar.getByText("Operasional", { exact: true })).toBeVisible();
  for (const sistem of ["Bagi hasil", "Gaji karyawan", "Biaya produksi / pembelian barang", "Tagihan rutin"]) {
    await expect(daftar.getByText(sistem, { exact: true })).toHaveCount(0);
  }
  // Pemasukan: marketplace tidak bisa dicatat manual (nanti dari impor file Excel).
  await page.keyboard.press("Escape");
  await kartu.getByText("Pemasukan", { exact: true }).click();
  await kartu.getByRole("combobox", { name: "Kategori" }).click();
  await expect(page.locator(".ant-select-dropdown:visible").getByText("Pemasukan lain", { exact: true })).toBeVisible();
  await expect(page.locator(".ant-select-dropdown:visible").getByText("Penjualan marketplace", { exact: true })).toHaveCount(0);
});

test("transaksi otomatis & sisihan dana: tanpa tombol Batalkan, ada tautan ke halaman asal", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/keuangan");
  const riwayat = page.locator(".ant-card", { hasText: "Riwayat transaksi" }).first();
  const otomatis = riwayat.locator("tr", { hasText: "Bayar tukang & supplier Selasa 22/09" });
  await expect(otomatis.getByText("Otomatis dari")).toBeVisible();
  await expect(otomatis.getByRole("button", { name: "Batalkan" })).toHaveCount(0);
  await expect(riwayat.locator("tr", { hasText: "lakban" }).first().getByRole("button", { name: "Batalkan" })).toBeVisible();

  const transfer = page.locator(".ant-card", { hasText: "Riwayat transfer antar akun kas" });
  const sisihan = transfer.locator("tr", { hasText: "Sisihan gaji" });
  await expect(sisihan.getByRole("button", { name: "Batalkan" })).toHaveCount(0);
  await expect(sisihan.getByText("Otomatis dari")).toBeVisible();
  await otomatis.getByRole("link", { name: "Bayar tukang & supplier" }).click();
  await expect(page).toHaveURL(/\/pesanan-tukang$/);
});

test("staf: kas kecil sederhana, 4 tombol kategori, panduan sekali, tanpa Batalkan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, { peran: "staff" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/kas-kecil$/);
  const panduan = page.locator(".ant-modal", { hasText: "Selamat datang!" });
  await expect(panduan).toBeVisible();
  await panduan.getByRole("button", { name: "Mengerti" }).click();
  await expect(panduan).toBeHidden();

  await expect(page.getByText("Sisa uang kas kecil", { exact: true })).toBeVisible();
  const kategori = page.getByRole("radiogroup", { name: "Kategori" }).getByRole("radio");
  await expect(kategori).toHaveText(["Transport", "Packing", "Operasional", "Lainnya"]);
  await expect(page.getByRole("button", { name: "Batalkan" })).toHaveCount(0);
  await expect(page.getByText("Salah catat? Minta admin membatalkan.").first()).toBeVisible();

  await page.getByRole("radio", { name: "Packing" }).click();
  await page.getByLabel("Jumlah").fill("15000");
  await page.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transaksi")).toMatchObject({ akun_id: "a3", kategori_id: "k10", jenis: "keluar", jumlah: "15000" });

  await page.reload();
  await expect(page.getByText("Sisa uang kas kecil", { exact: true })).toBeVisible();
  await expect(page.locator(".ant-modal", { hasText: "Selamat datang!" })).toHaveCount(0);

  // Menu staf: Kas kecil, Riwayat bulan ini, Profil saya.
  await page.getByRole("link", { name: "Riwayat bulan ini →" }).click();
  await expect(page).toHaveURL(/\/laporan\/kas-kecil$/);
  await expect(page.getByRole("heading", { name: "Riwayat bulan ini" })).toBeVisible();
});

test("pesan error ramah: tanpa istilah seed-now", async ({ page }) => {
  await pasangApiTiruan(page, {
    peran: "staff",
    galat: { "/transaksi": { status: 400, detail: "Kategori kas kecil belum ada (jalankan seed-now)" } },
  });
  await page.addInitScript(() => window.localStorage.setItem("bl-panduan-staf-v1:u3", "1"));
  await page.goto("/kas-kecil");
  await page.getByRole("radio", { name: "Transport" }).click();
  await page.getByLabel("Jumlah").fill("20000");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText("Aplikasi belum siap dipakai. Hubungi admin.")).toBeVisible();
  await expect(page.getByText(/seed/i)).toHaveCount(0);
});

test("tagihan penjual lain: catat pembayaran dengan tanggal", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/penjual-lain");
  await page.getByRole("button", { name: "Catat pembayaran diterima" }).click();
  const dlg = await dialogKonfirmasi(page);
  await expect(dlg.getByText("Tanggal uang diterima")).toBeVisible();
  await dlg.getByRole("button", { name: "Catat pembayaran" }).click();
  const body = (await tulisanTerkirim(panggilan, "POST", "/penerimaan-reseller")) as Record<string, unknown>;
  expect(body).toMatchObject({ pelanggan_id: "c1", order_ids: ["o1"] });
  expect(body.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("beranda: kas bisa dipakai terpisah dari dana cadangan, tagihan Selasa ini, yang perlu dikerjakan", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/");
  await expect(page.getByText("Kas bisa dipakai")).toBeVisible();
  await expect(page.getByText("Rp9.100.000", { exact: true })).toBeVisible(); // 10.100.000 − Dana cadangan 1.000.000
  await expect(page.getByText(/Dana cadangan Rp1\.000\.000/)).toBeVisible();
  await expect(page.getByText("Rp945.000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Semua belum dibayar Rp1\.795\.000/)).toBeVisible();
  await expect(page.getByText("Status semua order (sepanjang waktu)")).toBeVisible();

  const tugas = page.locator(".ant-card", { hasText: "Yang perlu dikerjakan" });
  await expect(tugas.locator('[data-tugas="selasa"]')).toContainText("Tutup Kas Mingguan");
  await expect(tugas.locator('[data-tugas="tukang"]')).toContainText("Bayar tukang & supplier Rp500.000");
  await expect(tugas.locator('[data-tugas="penjual-lain"]')).toContainText("Rp945.000 jatuh tempo Selasa ini");
  await expect(tugas.locator('[data-tugas="kas-iklan"]')).toContainText("di bawah 20% plafon");
  await tugas.locator('[data-tugas="selasa"]').getByRole("link").first().click();
  await expect(page).toHaveURL(/\/selasa$/);
});

test("tutup kas mingguan: wizard langkah demi langkah dengan status", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/selasa");
  await expect(page.getByRole("heading", { name: "Tutup Kas Mingguan" })).toBeVisible();
  await expect(page.getByText(/dari 6 langkah selesai/)).toBeVisible();
  // Langkah tanpa backend: tampil "Segera hadir", tidak bisa dikerjakan.
  await expect(page.getByText("Segera hadir", { exact: true })).toHaveCount(2);

  // Langkah 1 terbuka otomatis (ada tagihan): catat pembayaran di dalam wizard.
  await page.getByRole("button", { name: "Catat diterima" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("button", { name: "Catat pembayaran" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/penerimaan-reseller")).toMatchObject({ pelanggan_id: "c1", order_ids: ["o1"] });

  // Berikutnya → langkah 3 (tarik saldo), lewati, status tersimpan setelah muat ulang.
  await page.getByRole("button", { name: "Berikutnya →" }).click();
  await expect(page.getByRole("button", { name: "Tarik ke Kas utama" })).toBeVisible();
  await page.getByRole("button", { name: "Lewati langkah" }).click();
  await expect(page.locator('[data-langkah="tarik"]')).toContainText("Dilewati");
  await page.reload();
  await expect(page.locator('[data-langkah="tarik"]')).toContainText("Dilewati");

  // Langkah 4: bayar tukang & supplier, tombol "Bayar semua" (boleh juga per tukang).
  await page.getByText("4. Bayar tukang & supplier").click();
  await page.getByRole("button", { name: "Bayar semua Rp500.000" }).click();
  const dlg2 = await dialogKonfirmasi(page);
  await dlg2.getByRole("button", { name: "Catat pembayaran" }).click();
  const body = (await tulisanTerkirim(panggilan, "POST", "/pembayaran-pemasok")) as Record<string, unknown>;
  expect(body.tanggal).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
