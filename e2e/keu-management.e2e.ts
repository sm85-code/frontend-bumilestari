import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

test("edit akun dan proteksi hapus menawarkan nonaktifkan", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { galat: { "/keu/master/akun/a": { status: 409, detail: "Master masih memiliki keterkaitan data. Pilih Nonaktifkan." } } });
  await page.goto("/pengaturan");
  await page.getByRole("tab", { name: "akun", exact: true }).click();
  await page.getByRole("button", { name: "Edit akun Kas", exact: true }).click();
  await expect(page.getByLabel("Kode akun", { exact: true })).toHaveValue("KAS");
  await page.getByLabel("Nama akun", { exact: true }).fill("Kas Utama");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect.poll(() => calls.find(c => c.path === "/keu/akun/a")?.body).toEqual({ kode: "KAS", nama: "Kas Utama", jenis: "kas", saldo_awal: "0.00" });
  await page.getByRole("button", { name: "Hapus akun Kas", exact: true }).click();
  expect(calls.filter(c => c.metode === "DELETE")).toHaveLength(0);
  await page.getByRole("button", { name: "Konfirmasi hapus", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("keterkaitan");
  await page.getByRole("button", { name: "Nonaktifkan akun Kas", exact: true }).click();
  await expect.poll(() => calls.find(c => c.path === "/keu/master/akun/a/status")?.body).toEqual({ aktif: false });
});

test("reset memerlukan dua tahap, kata kunci tepat dan password owner", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { peran: "owner", balasan: {
    "/keu/reset/pratinjau": { challenge_id: "challenge", token: "x".repeat(64), expires_at: "2099-01-01T00:00:00Z", counts: { keu_transaksi: 3, keu_pesanan: 2, keu_settlement: 1 } },
    "/keu/reset": { direset: true }
  } });
  await page.goto("/pengaturan");
  await page.getByRole("button", { name: "Reset Data Keuangan", exact: true }).click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByText("Transaksi kas / bank: 3")).toBeVisible();
  await expect(modal.getByRole("button", { name: "Reset permanen", exact: true })).toHaveCount(0);
  await modal.getByRole("button", { name: "Lanjutkan konfirmasi", exact: true }).click();
  await expect(modal.getByRole("button", { name: "Reset permanen", exact: true })).toBeDisabled();
  await modal.getByLabel("Kata kunci reset").fill("reset-keuangan");
  await modal.getByLabel("Password owner").fill("Owner-password");
  await expect(modal.getByRole("button", { name: "Reset permanen", exact: true })).toBeDisabled();
  await modal.getByLabel("Kata kunci reset").fill("RESET-KEUANGAN");
  await modal.getByRole("button", { name: "Reset permanen", exact: true }).click();
  await expect(page.getByText(/Data keuangan keu berhasil direset/)).toBeVisible();
  await expect(modal).not.toBeVisible();
  expect(calls.find(c => c.path === "/keu/reset")?.body).toEqual({ challenge_id: "challenge", token: "x".repeat(64), konfirmasi: "RESET-KEUANGAN", password: "Owner-password" });
});

test("reset tidak tersedia untuk admin, batal konfirmasi tidak mereset", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "admin" });
  await page.goto("/pengaturan");
  await expect(page.getByRole("button", { name: "Reset Data Keuangan", exact: true })).toHaveCount(0);
});

test("reset ditolak mempertahankan modal dan menyediakan pratinjau ulang", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { peran: "owner", balasan: { "/keu/reset/pratinjau": { challenge_id: "c", token: "x".repeat(64), counts: { keu_transaksi: 1 } } }, galat: { "/keu/reset": { status: 409, detail: "Data berubah sejak pratinjau. Konfirmasi ulang." } } });
  await page.goto("/pengaturan");
  await page.getByRole("button", { name: "Reset Data Keuangan", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Lanjutkan konfirmasi", exact: true }).click();
  await modal.getByLabel("Kata kunci reset").fill("RESET-KEUANGAN");
  await modal.getByLabel("Password owner").fill("Owner-password");
  await modal.getByRole("button", { name: "Reset permanen", exact: true }).click();
  await expect(modal.getByRole("alert")).toContainText("Data berubah");
  await modal.getByRole("button", { name: "Perbarui pratinjau", exact: true }).click();
  await expect(modal.getByText("Transaksi kas / bank: 1")).toBeVisible();
  await modal.getByRole("button", { name: "Batal reset", exact: true }).click();
  await expect(modal).not.toBeVisible();
  expect(calls.filter(c => c.path === "/keu/reset")).toHaveLength(1);
});
