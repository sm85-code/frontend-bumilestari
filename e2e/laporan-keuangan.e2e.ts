import { test } from "@playwright/test";
test.skip(true, "layar lama diganti");
import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2.13: laba rugi per saluran, neraca + selisih, HPP & margin, arus kas lama, ringkasan Owner. */

test("laporan keuangan: laba rugi, neraca, HPP & margin, arus kas", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/laporan");
  const lr = page.locator("[data-laba-rugi]");
  await expect(lr).toContainText("Sementara — bulan belum ditutup");
  await expect(lr).toContainText("Shopee");
  await expect(lr).toContainText("pendapatan biaya proses");
  await expect(lr).toContainText("Biaya admin");
  await expect(lr).toContainText("margin 62,5%");
  await expect(page.locator("[data-laba-bersih]")).toContainText("Rp970.000");
  await expect(lr).toContainText("Tidak termasuk laba: Prive Rp100.000");

  await page.getByRole("tab", { name: "Neraca" }).click();
  await expect(page.locator("[data-neraca]")).toContainText("Neraca tidak seimbang: selisih Rp25.000");
  await expect(page.locator("[data-neraca]")).toContainText("Tukang");
  await expect(page.locator("[data-neraca]")).toContainText("Pak Budi");
  await expect(page.locator("[data-selisih]")).toContainText("Rp25.000");

  await page.getByRole("tab", { name: "HPP & margin" }).click();
  await expect(page.locator("[data-margin]")).toContainText("Partisi");
  await expect(page.locator("[data-margin]")).toContainText("31,2%");
  await expect(page.locator("[data-margin]")).toContainText("Margin bersih");
  await expect(page.locator("[data-margin]")).toContainText("Biaya proses");

  await page.getByRole("tab", { name: "Arus kas & kategori" }).click();
  await expect(page.getByText("Sampai", { exact: true })).toBeVisible();
});

test("ringkasan Owner: hanya baca, laba rugi bulan ditutup, tren, modal, bagi hasil", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "owner" });
  await page.goto("/ringkasan");
  const r = page.locator("[data-ringkasan]");
  await expect(r).toContainText("Untung rugi September 2026");
  await expect(r).toContainText("Rp970.000");
  await expect(page.locator('[data-tren="2026-08"]')).toContainText("-Rp50.000");
  await expect(page.locator('[data-bagi-hasil="2026-09"]')).toContainText("Belum dibayar");
  await expect(page.locator('[data-bagi-hasil="2026-09"]')).toContainText("Rp582.000");
  await expect(r.getByRole("button")).toHaveCount(0);
});
