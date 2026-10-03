import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, hp, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2.9/2.10: kas iklan — top up wajib platform + sisa budget 25/75, pengembalian, plafon & log. */

test("kas iklan: top up wajib platform, peringatan melebihi porsi, pengembalian, ubah plafon", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/kas-iklan");
  await expect(page.locator("[data-budget]")).toContainText("Terpakai Rp2.300.000 dari Rp2.500.000 · sisa Rp200.000");

  const simpan = page.getByRole("button", { name: "Simpan", exact: true });
  await page.getByLabel("Jumlah").fill("500000");
  await expect(simpan).toBeDisabled(); // platform wajib
  await page.getByLabel("Platform iklan").click();
  await page.locator(".ant-select-dropdown:visible .ant-select-item-option", { hasText: "Shopee" }).click();
  await expect(page.locator("[data-sisa-budget]")).toContainText("Melebihi porsi: tetap boleh disimpan");
  await simpan.click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transaksi")).toMatchObject({ akun_id: "a5", jumlah: "500000", platform_iklan_id: "pi1", kategori_id: "k11" });

  await page.getByRole("button", { name: "Kembalikan semua" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("iklan dihentikan");
  await dlg.getByRole("button", { name: "Kembalikan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/kas-iklan/pengembalian")).toMatchObject({ jumlah: "1600000", keterangan: "iklan dihentikan" });

  await page.getByRole("button", { name: "Ubah plafon" }).click();
  await expect(page.locator("[data-ubah-plafon]")).toContainText("Rp1.500.000 → Rp2.000.000 (naik)");
  await page.getByLabel("Plafon baru").fill("1.000.000");
  await page.getByLabel("Alasan plafon").fill("hemat");
  await page.getByRole("button", { name: "Simpan plafon" }).click();
  expect(await tulisanTerkirim(panggilan, "PUT", "/akun-kas/a5/plafon")).toEqual({ plafon: "1000000", alasan: "hemat" });

  await page.getByLabel("Porsi internal").fill("30");
  await page.getByRole("button", { name: "Simpan budget" }).click();
  expect(await tulisanTerkirim(panggilan, "PUT", "/kas-iklan/pengaturan")).toEqual({ porsi_internal: "30", porsi_eksternal: "70", budget_bulanan: null });
});

test("kas iklan khusus admin: owner tidak melihat menu dan diarahkan ke Beranda", async ({ page }, info) => {
  test.skip(hp(info.project.name), "Menu samping hanya di laptop.");
  await pasangApiTiruan(page, { peran: "owner" });
  await page.goto("/kas-iklan");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("menuitem", { name: /Kas iklan/ })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /Kas kecil/ }).first()).toBeVisible();
});
