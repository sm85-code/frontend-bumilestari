import { test } from "@playwright/test";
test.skip(true, "layar lama diganti");
import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, hp, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2.14/2.15: kelola kolom tambahan & label inti, isian di form, kolom di tabel. */

test("admin mengelola kolom tambahan dan label kolom inti", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/master");
  await page.getByRole("link", { name: "Kolom & label →" }).click();
  await expect(page).toHaveURL(/\/master\/kolom$/);
  const daftar = page.locator("[data-kolom-daftar]");
  await expect(daftar).toContainText("No. resi");
  await expect(daftar).toContainText("Kurir");
  await expect(daftar).not.toContainText("No. nota");

  await page.getByRole("button", { name: "Tambah kolom" }).click();
  await page.getByLabel("Label kolom").fill("Bahan");
  await page.getByLabel("Jenis data").click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "Pilihan" }).click();
  await page.getByLabel("Daftar pilihan").fill("Jati, Mahoni");
  await page.getByRole("checkbox", { name: "Tampil di tabel" }).check();
  await page.getByRole("button", { name: "Simpan kolom" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/definisi-kolom")).toMatchObject({
    entitas: "order", label: "Bahan", tipe: "pilihan", pilihan: ["Jati", "Mahoni"], tampil_tabel: true, tampil_staf: false,
  });

  await daftar.getByRole("button", { name: "Nonaktifkan" }).first().click();
  expect(await tulisanTerkirim(panggilan, "POST", "/definisi-kolom/dk1/nonaktif")).toEqual({});
  await expect(daftar.getByRole("button", { name: "Hapus" })).toHaveCount(1); // hanya Kurir (terisi 0)
  await daftar.getByRole("button", { name: "Hapus" }).click();
  await (await dialogKonfirmasi(page)).getByRole("button", { name: "Hapus" }).click();
  expect(await tulisanTerkirim(panggilan, "DELETE", "/definisi-kolom/dk2")).toEqual({});

  await page.getByRole("button", { name: "Ganti label" }).first().click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("No. pesanan");
  await dlg.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "PATCH", "/definisi-kolom/inti/order/no_order")).toEqual({ label: "No. pesanan" });
});

test("kolom tambahan tampil di tabel order dan isian form transaksi", async ({ page }, info) => {
  const panggilan = await pasangApiTiruan(page);
  if (!hp(info.project.name)) {
    await page.goto("/order");
    await expect(page.getByRole("columnheader", { name: "No. resi" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "JX-1" })).toBeVisible();
  }
  await page.goto("/keuangan");
  await page.getByRole("button", { name: "Catat manual" }).click();
  await page.getByRole("combobox", { name: "Kategori" }).click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "Operasional" }).click();
  const isian = page.locator('[data-kolom-tambahan="transaksi"]').first();
  await expect(isian).toBeVisible();
  await isian.getByLabel("No. nota / struk").fill("N-77");
  await page.getByLabel("Jumlah").first().fill("25000");
  await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transaksi")).toMatchObject({ kolom_tambahan: { no_nota_struk: "N-77" } });
});

test("owner tidak melihat kolom tambahan", async ({ page }, info) => {
  test.skip(hp(info.project.name), "Tabel order di laptop.");
  await pasangApiTiruan(page, { peran: "owner", data: { "/definisi-kolom": [] } });
  await page.goto("/order");
  await expect(page.getByRole("columnheader", { name: "No. resi" })).toHaveCount(0);
});
