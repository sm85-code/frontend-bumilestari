import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

test("kas presisi dan semua modul keu tersedia", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await pasangApiTiruan(page);
  await page.goto("/");
  await expect(page.getByText("Rp 9.007.199.254.740.993,01")).toBeVisible();
  for (const [link, title] of [["Import", "Import"], ["Sinkronisasi", "Sinkronisasi"], ["Produksi", "Produksi"], ["Keuangan", "Keuangan"]]) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("staff tidak dapat membuka modul keuangan", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", request => { if (request.url().includes("/keu/")) calls.push(request.url()); });
  await pasangApiTiruan(page, { peran: "staff" });
  await page.goto("/keuangan");
  await expect(page).toHaveURL(/\/kas-kecil$/);
  await expect(page.getByRole("link", { name: "Keuangan", exact: true })).toHaveCount(0);
  expect(calls).toEqual([]);
});

test("wajib ganti password memblokir modul keu", async ({ page }) => {
  await pasangApiTiruan(page, { data: { "/auth/me": { id: "u", nama: "Owner Test", email: "test@local", role: "owner", aktif: true, must_change_password: true } } });
  await page.goto("/pengaturan");
  await expect(page).toHaveURL(/\/akun$/);
  await expect(page.getByText("Demi keamanan, ganti kata sandi bawaan Anda dulu sebelum memakai aplikasi.")).toBeVisible();
});

test("delapan slot vendor dinamis dapat disimpan", async ({ page }) => {
  const calls = await pasangApiTiruan(page);
  await page.goto("/pengaturan");
  await expect(page.getByLabel("Nama sup-3", { exact: true })).toBeVisible();
  await page.getByLabel("Nama tk-2", { exact: true }).fill("Vendor Baru");
  await page.getByRole("button", { name: "Simpan tk-2", exact: true }).click();
  await expect.poll(() => calls.find(c => c.path === "/keu/vendor-slot/tk-2")?.body).toEqual({ nama: "Vendor Baru", kontak: "", jenis: "tukang_kayu" });
});

test("kesalahan impor tidak dapat diterapkan", async ({ page }) => {
  const batch = { id: "batch", nama_file: "bad.csv", jenis: "order", status: "draf", rows: [{ id: "row", nomor_baris: 2, sumber_ref: "bad", status: "gagal", kesalahan: [{ pesan: "Kuantitas tidak valid" }] }] };
  await pasangApiTiruan(page, { balasan: { "/keu/impor/pratinjau": batch } });
  await page.goto("/impor");
  await page.getByLabel("Saluran impor", { exact: true }).selectOption("s");
  await page.getByLabel("File CSV atau Excel", { exact: true }).setInputFiles({ name: "bad.csv", mimeType: "text/csv", buffer: Buffer.from("test\nbad") });
  await page.getByRole("button", { name: "Pratinjau", exact: true }).click();
  await expect(page.getByText("Kuantitas tidak valid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Terapkan impor", exact: true })).toBeDisabled();
});

test("settlement gagal rekonsiliasi tetap menampilkan kesalahan", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { galat: { "/keu/settlement/st/posting": { status: 409, detail: "Alokasi belum sama dengan neto" } } });
  await page.goto("/keuangan");
  await page.getByRole("button", { name: "Rekonsiliasi", exact: true }).click();
  await page.getByLabel("Akun penerima settlement", { exact: true }).selectOption("a");
  await page.getByLabel("Kategori settlement", { exact: true }).selectOption("income");
  await page.getByRole("button", { name: "Posting settlement", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Alokasi belum sama dengan neto");
  expect(calls.filter(c => c.path === "/keu/settlement/st/posting")).toHaveLength(1);
});

test("retry pesanan mempertahankan referensi dan nominal presisi", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { galat: { "/keu/pesanan": { status: 503, detail: "Coba kembali", sekali: true } } });
  await page.goto("/order");
  await page.getByRole("button", { name: "Input pesanan manual", exact: true }).click();
  await page.getByLabel("Saluran manual", { exact: true }).selectOption("s");
  await page.getByLabel("Nomor pesanan", { exact: true }).fill("MANUAL-2");
  await page.getByLabel("Produk", { exact: true }).selectOption("p");
  await page.getByLabel("Kuantitas", { exact: true }).fill("2");
  await page.getByLabel("Harga satuan (contoh 125000.00)", { exact: true }).fill("9007199254740993.01");
  await page.getByRole("button", { name: "Simpan pesanan", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Coba kembali");
  await page.getByRole("button", { name: "Simpan pesanan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Input pesanan manual", exact: true })).toBeVisible();
  const rows = calls.filter(c => c.path === "/keu/pesanan");
  expect(rows).toHaveLength(2);
  expect(rows[0].body).toEqual(rows[1].body);
  expect(rows[0].body).toMatchObject({ total_sumber: "18014398509481986.02", items: [{ qty: 2, harga_satuan: "9007199254740993.01", subtotal_sumber: "18014398509481986.02" }] });
});

test("sesi habis mengarahkan pengguna ke halaman masuk", async ({ page }) => {
  await pasangApiTiruan(page, { galat: { "/keu/vendor-slot/tk-2": { status: 401, detail: "Sesi berakhir" } } });
  await page.goto("/pengaturan");
  await page.getByLabel("Nama tk-2", { exact: true }).fill("Vendor Baru");
  await page.getByRole("button", { name: "Simpan tk-2", exact: true }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.getByRole("link", { name: "Pengaturan", exact: true })).toHaveCount(0);
});

test("rentang pesanan dan settlement terpisah serta pagination mengikuti rentang", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { balasan: { "/keu/saluran/erp/tarik": { dibaca: 100, terproses: 100, gagal: 0, ada_lanjutan: true, halaman_berikutnya: { setelah_at: "2026-10-06T10:00:00+00:00", setelah_ref: "last-order" } } } });
  await page.goto("/sinkronisasi");
  const orders = page.getByRole("region", { name: "Pesanan ERP Test", exact: true });
  const settlements = page.getByRole("region", { name: "Settlement ERP Test", exact: true });
  await expect(orders.getByRole("button", { name: "Tarik pesanan", exact: true })).toBeDisabled();
  await orders.getByLabel("Tanggal awal pesanan", { exact: true }).fill("2026-09-01");
  await orders.getByLabel("Tanggal akhir pesanan", { exact: true }).fill("2026-09-30");
  await settlements.getByLabel("Tanggal awal settlement", { exact: true }).fill("2026-08-01");
  await settlements.getByLabel("Tanggal akhir settlement", { exact: true }).fill("2026-08-31");
  await orders.getByRole("button", { name: "Tarik pesanan", exact: true }).click();
  await expect(orders.getByRole("button", { name: "Tarik 100 berikutnya (pesanan)", exact: true })).toBeVisible();
  await orders.getByRole("button", { name: "Tarik 100 berikutnya (pesanan)", exact: true }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/saluran/erp/tarik").length).toBe(2);
  await settlements.getByRole("button", { name: "Tarik settlement", exact: true }).click();
  await expect(settlements.getByRole("status")).toContainText("2026-08-01–2026-08-31");
  const pulls = calls.filter(c => c.path === "/keu/saluran/erp/tarik");
  const first = new URLSearchParams(pulls[0].cari), next = new URLSearchParams(pulls[1].cari), payout = new URLSearchParams(pulls[2].cari);
  expect(first.get("tanggal_awal")).toBe("2026-09-01");
  expect(first.get("tanggal_akhir")).toBe("2026-09-30");
  expect(next.get("setelah_ref")).toBe("last-order");
  expect(next.get("tanggal_awal")).toBe("2026-09-01");
  expect(payout.get("entitas")).toBe("settlement");
  expect(payout.get("tanggal_awal")).toBe("2026-08-01");
  expect(payout.has("setelah_ref")).toBe(false);
  await orders.getByLabel("Tanggal awal pesanan", { exact: true }).fill("2026-09-05");
  await expect(orders.getByRole("button", { name: "Tarik 100 berikutnya (pesanan)", exact: true })).toHaveCount(0);
  await orders.getByRole("button", { name: "Tarik pesanan", exact: true }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/saluran/erp/tarik").length).toBe(4);
  const fresh = new URLSearchParams(calls.filter(c => c.path === "/keu/saluran/erp/tarik")[3].cari);
  expect(fresh.get("tanggal_awal")).toBe("2026-09-05");
  expect(fresh.has("setelah_at")).toBe(false);
});

test("rentang tanggal terbalik tidak dapat ditarik", async ({ page }) => {
  const calls = await pasangApiTiruan(page);
  await page.goto("/sinkronisasi");
  const orders = page.getByRole("region", { name: "Pesanan ERP Test", exact: true });
  await orders.getByLabel("Tanggal awal pesanan", { exact: true }).fill("2026-09-30");
  await orders.getByLabel("Tanggal akhir pesanan", { exact: true }).fill("2026-09-01");
  await expect(orders.getByRole("button", { name: "Tarik pesanan", exact: true })).toBeDisabled();
  expect(calls.filter(c => c.path.includes("/tarik"))).toHaveLength(0);
});
