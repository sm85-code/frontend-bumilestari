import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

const draft = { id: "draft", sku: "CHILD-L", sku_induk: "PARENT", nama_asli: "Nama asli panjang marketplace", nama: "Nama asli panjang marketplace", gambar_url: "https://img.example.test/photo.jpg", harga_jual: "123456.78", biaya_acuan: "0.00", jenis: null, varian_list: [{ kategori: "Varian", nilai: "L" }], status: "draf", aktif: false };
const productPage = { rows: [draft], total: 1, limit: 50, offset: 0 };

test("draft: gambar, nama asli readonly, varian fleksibel dan simpan master", async ({ page }) => {
  await page.route("https://img.example.test/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="green"/></svg>' }));
  const calls = await pasangApiTiruan(page, { data: { "/keu/produk": productPage } });
  await page.goto("/pengaturan");
  await expect(page.getByText("Draf · perlu pemetaan")).toBeVisible();
  await expect(page.getByRole("img", { name: draft.nama })).toBeVisible();
  await page.getByRole("button", { name: "Edit produk CHILD-L" }).click();
  await page.getByLabel("Nama produk ringkas").fill("Kayu L");
  await page.getByLabel("Jenis produk").selectOption("kayu");
  await page.getByLabel("Biaya acuan / modal").fill("45678.90");
  await page.getByLabel("Kategori varian 1").fill("Ukuran");
  for (let index = 2; index <= 7; index++) {
    await page.getByRole("button", { name: "Tambah varian", exact: true }).click();
    await page.getByLabel(`Kategori varian ${index}`, { exact: true }).fill(`Kategori ${index}`);
    await page.getByLabel(`Nilai varian ${index}`, { exact: true }).fill(`Nilai ${index}`);
  }
  await page.getByRole("button", { name: "Hapus varian 7" }).click();
  await page.getByRole("button", { name: "Simpan sebagai Master" }).click();
  await expect.poll(() => calls.find(c => c.path === "/keu/produk/draft")?.metode).toBe("PATCH");
  const body = calls.find(c => c.path === "/keu/produk/draft")?.body as Record<string, unknown>;
  expect(body.nama).toBe("Kayu L");
  expect(body.biaya_acuan).toBe("45678.90");
  expect(body.varian_list).toHaveLength(6);
  for (const key of ["sku", "sku_induk", "nama_asli", "gambar_url", "harga_jual", "status"]) expect(body).not.toHaveProperty(key);
  await expect(page.getByRole("heading", { name: "Pemetaan CHILD-L" })).toHaveCount(0);
});

test("produk manual dan gagal simpan mempertahankan input", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { galat: { "/keu/produk": { status: 409, detail: "SKU sudah digunakan", sekali: true } } });
  await page.goto("/pengaturan");
  await page.getByRole("button", { name: "Tambah produk manual" }).click();
  await page.getByLabel("SKU varian", { exact: true }).fill("MANUAL-L");
  await page.getByLabel("SKU induk (opsional)").fill("MANUAL");
  await page.getByLabel("Nama produk ringkas").fill("Lampu L");
  await page.getByLabel("Jenis produk").selectOption("non_kayu");
  await page.getByLabel("Harga jual", { exact: true }).fill("100.01");
  await page.getByRole("button", { name: "Simpan sebagai Master" }).click();
  await expect(page.getByRole("alert")).toHaveText("SKU sudah digunakan");
  await expect(page.getByLabel("Nama produk ringkas")).toHaveValue("Lampu L");
  await page.getByRole("button", { name: "Simpan sebagai Master" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/produk").length).toBe(2);
  expect(calls.find(c => c.path === "/keu/produk")?.body).toMatchObject({ sku: "MANUAL-L", sku_induk: "MANUAL", nama: "Lampu L", jenis: "non_kayu", harga_jual: "100.01", varian_list: [] });
});

test("draft tidak tersedia untuk input manual atau alokasi vendor", async ({ page }) => {
  await pasangApiTiruan(page, { data: { "/keu/produk": productPage, "/keu/item": { rows: [{ id: "i", sumber_ref: "line", produk_id: "draft", nama_snapshot: "Draft", qty: 1 }], total: 1 } } });
  await page.goto("/order");
  await page.getByRole("button", { name: "Input pesanan manual" }).click();
  await expect(page.getByLabel("Produk", { exact: true }).locator('option[value="draft"]')).toHaveCount(0);
  if (await page.getByRole("button", { name: "Menu", exact: true }).isVisible()) await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("link", { name: "Produksi", exact: true }).click();
  await expect(page.getByLabel("Item pesanan").locator('option[value="i"]')).toHaveCount(0);
});
