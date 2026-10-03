import { expect, test, type Page } from "@playwright/test";
import { pasangApiTiruan, type Panggilan } from "./mock-api";

const hp = (nama: string) => nama === "hp";
const urlAkhir = (path: string) => new RegExp(path === "/" ? "/$" : `${path}$`);

async function tulisanTerkirim(panggilan: Panggilan[], metode: string, path: string) {
  await expect.poll(() => panggilan.find((p) => p.metode === metode && p.path === path)?.body).toBeTruthy();
  return panggilan.find((p) => p.metode === metode && p.path === path)!.body;
}

async function dialogKonfirmasi(page: Page) {
  const dlg = page.locator(".ant-modal-confirm");
  await expect(dlg).toBeVisible();
  return dlg;
}

test("semua menu navigasi bisa diklik (menu dikelompokkan, URL lama tetap)", async ({ page }, info) => {
  await pasangApiTiruan(page);
  await page.goto("/");
  await expect(page.getByText("Kas bisa dipakai").first()).toBeVisible();

  if (!hp(info.project.name)) {
    const samping = page.locator('aside[aria-label="Menu samping"]');
    for (const grup of ["Rutin", "Penjualan", "Pembelian", "Uang", "Laporan", "Pengaturan"]) {
      await expect(samping.locator(".ant-menu-item-group-title", { hasText: new RegExp(`^${grup}$`) })).toBeVisible();
    }
    const menu: [string, string][] = [
      ["Rutinitas Selasa", "/selasa"], ["Order", "/order"], ["Tagihan penjual lain", "/penjual-lain"], ["Bayar tukang & supplier", "/pesanan-tukang"],
      ["Kas & transaksi", "/keuangan"], ["Gaji & tagihan rutin", "/gaji"], ["Bagi hasil", "/bagi-hasil"],
      ["Laba rugi", "/laporan"], ["Data master", "/master"], ["Profil saya", "/akun"], ["Beranda", "/"],
    ];
    for (const [label, path] of menu) {
      await samping.locator(".ant-menu-item", { hasText: new RegExp(`^${label.replace(/[&]/g, "\\$&")}$`) }).click();
      await expect(page).toHaveURL(urlAkhir(path));
    }
    // Dua menu "Kas kecil": di grup Uang (/kas-kecil) dan Laporan (/laporan/kas-kecil).
    await samping.locator('.ant-menu-item[data-menu-id$="/kas-kecil"]').first().click();
    await expect(page).toHaveURL(urlAkhir("/kas-kecil"));
    await samping.locator('.ant-menu-item[data-menu-id$="/laporan/kas-kecil"]').click();
    await expect(page).toHaveURL(urlAkhir("/laporan/kas-kecil"));
  } else {
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    for (const [label, path] of [["Order", "/order"], ["Selasa", "/selasa"], ["Kas", "/keuangan"], ["Lainnya", "/lainnya"], ["Beranda", "/"]]) {
      await nav.getByRole("button", { name: label, exact: true }).click();
      await expect(page).toHaveURL(urlAkhir(path));
    }
    await nav.getByRole("button", { name: "Lainnya" }).click();
    await expect(page.getByText("Pengaturan", { exact: true })).toBeVisible();
    await page.getByText("Gaji & tagihan rutin").click();
    await expect(page).toHaveURL(urlAkhir("/gaji"));
  }
});

test("dialog order baru: select dan pemilih tanggal berfungsi", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/order");
  await page.getByRole("button", { name: /Order baru/ }).click();
  await expect(page.getByText("Simpan order")).toBeVisible();

  await page.locator(".ant-modal .ant-select").first().click();
  await expect(page.locator(".ant-select-dropdown:visible")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator(".ant-modal .ant-picker").first().click();
  await page.locator(".ant-picker-cell-today").first().click();
  await expect(page.locator(".ant-modal .ant-picker input").first()).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);

  await page.locator(".ant-modal-close").click();
  await expect(page.locator(".ant-modal")).toHaveCount(0);
});

test("batalkan order meminta konfirmasi dan tidak mengirim bila dibatalkan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/order");
  await page.getByRole("button", { name: "Batalkan" }).first().click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.locator(".ant-modal-confirm")).toHaveCount(0);
  expect(panggilan).toEqual([]);
});

test("pilih tukang untuk order yang belum punya tukang", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/order");
  await page.getByRole("button", { name: "Pilih tukang" }).click();
  await expect(page.getByText("Simpan perubahan")).toBeVisible();
  await page.locator(".ant-modal .ant-select").first().click();
  await page.locator(".ant-select-item-option", { hasText: "AHMAD NUR ALIM" }).click();
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  expect(await tulisanTerkirim(panggilan, "PATCH", "/order/o2")).toEqual({ pemasok_id: "m1" });
});

test("riwayat transfer: batalkan dengan alasan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/keuangan");
  const kartu = page.locator(".ant-card", { hasText: "Riwayat transfer antar akun" });
  await expect(kartu.getByText("Saldo Shopee → Kas utama")).toBeVisible();
  await kartu.getByRole("button", { name: "Batalkan" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.locator("textarea").fill("salah jumlah");
  await dlg.getByRole("button", { name: "Batalkan transfer" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transfer/tr1/batal")).toEqual({ alasan: "salah jumlah" });
});

test("selasa: batalkan penyisihan dana gaji", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/selasa");
  await page.getByRole("button", { name: "Batalkan penyisihan" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.locator("textarea").fill("nominal keliru");
  await dlg.getByRole("button", { name: "Batalkan penyisihan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/sisihan/sis1/batal")).toEqual({ alasan: "nominal keliru" });
});

test("master data: semua tab bisa dibuka", async ({ page }, info) => {
  test.skip(hp(info.project.name), "Di HP tab yang tidak muat berpindah ke menu '…' (perilaku bawaan antd).");
  await pasangApiTiruan(page);
  await page.goto("/master");
  for (const nama of ["Tukang & supplier", "Penjual lain", "Harga grosir", "Saluran", "Akun kas & kategori", "Pengguna", "Profil UMKM", "Produk"]) {
    const tab = page.getByRole("tab", { name: nama });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
});
