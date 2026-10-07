import { expect, test, type Page } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

const pageOf = (rows: unknown[]) => ({ rows, total: rows.length, limit: 50, offset: 0 });
async function setup(page: Page) {
  return pasangApiTiruan(page, { data: {
    "/keu/buku": { aktif: true, pengaturan: { tanggal_awal: "2026-10-01", metode_stok: "fifo", tanggal_status: "updated_at" } },
    "/keu/utang-vendor": pageOf([{ id: "v", nama: "Vendor Test", utang: "10.00" }]),
    "/keu/jurnal": pageOf([]), "/keu/coa": pageOf([]), "/keu/buku-kas": pageOf([]),
  } });
}

test("empat tab memisahkan pelunasan vendor, bahan, operasional dan gaji/iklan", async ({ page }) => {
  const calls = await setup(page);
  await page.goto("/keuangan");
  await expect(page.getByRole("heading", { name: "Pemasukan kas manual" })).toBeVisible();
  await expect(page.getByLabel("Jenis transaksi").locator('option[value="keluar"]')).toHaveCount(0);
  const panel = page.getByRole("tabpanel", { name: "Pembayaran Tukang & Supplier" });
  await expect(panel.getByText("Vendor Test", { exact: true })).toBeVisible();
  await panel.getByLabel("Vendor yang dibayar").selectOption("v");
  await panel.getByLabel("Akun pembayaran vendor").selectOption("a");
  await panel.getByLabel("Jumlah pembayaran vendor").fill("10");
  await panel.getByRole("button", { name: "Posting Pembayaran Vendor" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/vendor/pembayaran").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/vendor/pembayaran")?.body).toMatchObject({ vendor_id: "v", jumlah: "10", akun_kas_id: "a" });
  for (const [title, tab, category] of [
    ["Belanja Cat & Bahan Pendukung", "bahan", "cat"],
    ["Belanja Operasional", "operasional", "sewa"],
    ["Gaji Karyawan & Iklan", "gaji_iklan", "ads_shopee"],
  ]) {
    await page.getByRole("tab", { name: title }).click();
    await expect(page.getByRole("tab", { name: title })).toHaveAttribute("aria-selected", "true");
    await page.getByLabel("Kategori pengeluaran").selectOption(category);
    await page.getByLabel("Akun pembayaran pengeluaran").selectOption("a");
    await page.getByLabel("Jumlah pengeluaran").fill("9007199254740993.01");
    await page.getByLabel("Keterangan pengeluaran").fill(`Pembayaran ${category}`);
    await page.getByRole("button", { name: "Posting Pengeluaran" }).click();
    await expect.poll(() => calls.filter(c => c.path === "/keu/pengeluaran").length).toBe(["bahan", "operasional", "gaji_iklan"].indexOf(tab) + 1);
    expect(calls.filter(c => c.path === "/keu/pengeluaran").at(-1)?.body).toMatchObject({ tab, kategori: category, jumlah: "9007199254740993.01", akun_kas_id: "a" });
  }
  await expect(page.getByLabel("Kategori pengeluaran").locator('option[value="cat"]')).toHaveCount(0);
  expect(calls.every(c => c.path.startsWith("/keu/"))).toBe(true);
});

test("setiap tab memakai tanggal dan pencarian, rentang terbalik tidak dikirim", async ({ page }) => {
  await setup(page);
  const urls: URL[] = [];
  page.on("request", r => { if (r.method() === "GET" && new URL(r.url()).pathname.endsWith("/keu/pengeluaran")) urls.push(new URL(r.url())); });
  await page.goto("/keuangan");
  for (const [title, tab] of [["Pembayaran Tukang & Supplier", "vendor"], ["Belanja Cat & Bahan Pendukung", "bahan"], ["Belanja Operasional", "operasional"], ["Gaji Karyawan & Iklan", "gaji_iklan"]]) {
    await page.getByRole("tab", { name: title }).click();
    await page.getByLabel("Tanggal awal pengeluaran").fill("2026-10-01");
    await page.getByLabel("Tanggal akhir pengeluaran").fill("2026-10-06");
    await page.getByLabel("Cari pengeluaran").fill("Cat & Gaji 50% _");
    await expect.poll(() => urls.some(url => url.searchParams.get("tab") === tab && url.searchParams.get("tanggal_akhir") === "2026-10-06" && url.searchParams.get("search") === "Cat & Gaji 50% _")).toBe(true);
    await page.getByLabel("Tanggal awal pengeluaran").fill("2026-10-07");
    await expect(page.getByRole("alert")).toContainText("Tanggal awal pengeluaran tidak boleh melebihi");
  }
  expect(urls.every(url => (url.searchParams.get("tanggal_awal") ?? "") <= (url.searchParams.get("tanggal_akhir") ?? ""))).toBe(true);
});

test("unpost tiap tab mengeluarkan transaksi dari daftar aktif dan menyimpan riwayat", async ({ page }) => {
  await setup(page);
  const cancelled = new Set<string>();
  const bodies: unknown[] = [];
  await page.route("**/api/bumi-lestari/keu/pengeluaran?**", route => {
    const url = new URL(route.request().url());
    const tab = url.searchParams.get("tab")!;
    const history = url.searchParams.get("status") === "batal";
    const rows = cancelled.has(tab) === history ? [{ id: tab, jenis: "pengeluaran", tanggal: "2026-10-06", status: history ? "dibatalkan" : "terkirim", keterangan: `Pengeluaran ${tab}`, jumlah: "10.00", rincian: {}, baris: [], alasan_batal: history ? "Koreksi bukti" : "" }] : [];
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(pageOf(rows)) });
  });
  await page.route("**/api/bumi-lestari/keu/jurnal/*/unpost", route => {
    const tab = new URL(route.request().url()).pathname.split("/").at(-2)!;
    cancelled.add(tab); bodies.push(route.request().postDataJSON());
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ id: tab, status: "dibatalkan" }) });
  });
  await page.goto("/keuangan");
  for (const title of ["Pembayaran Tukang & Supplier", "Belanja Cat & Bahan Pendukung", "Belanja Operasional", "Gaji Karyawan & Iklan"]) {
    await page.getByRole("tab", { name: title }).click();
    const panel = page.getByRole("tabpanel", { name: title });
    await panel.getByRole("button", { name: "Batalkan Post", exact: true }).click();
    await panel.getByLabel("Alasan pembatalan").fill("Koreksi bukti");
    await panel.getByRole("button", { name: "Konfirmasi Batal Post" }).click();
    await expect(panel.getByText("Belum ada data.")).toBeVisible();
    await panel.getByRole("button", { name: "Riwayat Pengeluaran Dibatalkan" }).click();
    await expect(panel.getByText("Koreksi bukti")).toBeVisible();
    await expect(panel.getByRole("button", { name: "Batalkan Post", exact: true })).toHaveCount(0);
  }
  expect(bodies).toEqual(Array.from({ length: 4 }, () => ({ alasan: "Koreksi bukti" })));
});
