import { expect, test, type Page } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

const pageOf = (rows: unknown[]) => ({ rows, total: rows.length, limit: 50, offset: 0 });
async function ledgerApi(page: Page, active = true) {
  const calls = await pasangApiTiruan(page, { peran: "owner" });
  const data: Record<string, unknown> = {
    "/buku": { aktif: active, pengaturan: active ? { tanggal_awal: "2026-10-01", metode_stok: "fifo", tanggal_status: "updated_at" } : null },
    "/coa": pageOf([{ id: "cash", kode: "KAS", nama: "Kas", jenis: "aset", kelompok: "kas", kas_akun_id: "a", sistem: true, aktif: true }, { id: "capital", kode: "MODAL", nama: "Modal", jenis: "ekuitas", kelompok: "modal", sistem: true, aktif: true }]),
    "/akun": pageOf([{ id: "a", nama: "Kas", kode: "KAS", jenis: "kas", saldo_awal: "0.00", aktif: true }, { id: "bank", nama: "Bank", kode: "BANK", jenis: "bank", saldo_awal: "0.00", aktif: true }]),
    "/buku-kas": pageOf([]), "/jurnal": pageOf([]), "/utang-vendor": pageOf([{ id: "v", nama: "Vendor Test", utang: "10.00" }]), "/kategori-coa": [],
    "/stok": pageOf([{ id: "p", sku: "TEST", nama: "Kayu Test", qty: 3, nilai: "15.00", batch: [{ id: "batch-1", tanggal: "2026-10-06", qty: 3, nilai: "15.00" }] }]),
    "/piutang": pageOf([{ id: "o", nomor: "TEST-1", status_sumber: "shipped", pengiriman: "20.00", escrow: "0.00" }]),
    "/laporan-keuangan": {
      laba_rugi: { pendapatan: [{ nama: "Pendapatan", kelompok: "pendapatan", nilai: "20.00" }], beban: [{ nama: "HPP Stok", kelompok: "hpp_stok", nilai: "5.00" }], pendapatan_bersih: "20.00", hpp: "5.00", beban_operasional: "0.00", shu: "15.00" },
      neraca: { aset: [{ nama: "Piutang Pengiriman", kelompok: "piutang_pengiriman", nilai: "20.00" }], kewajiban: [], ekuitas: [{ nama: "SHU", kelompok: "shu", nilai: "20.00" }], total_aset: "20.00", total_kewajiban: "0.00", total_ekuitas: "20.00", selisih: "0.00" },
      arus_kas: { kelompok: { operasional: { masuk: "0.00", keluar: "0.00", neto: "0.00" }, investasi: { masuk: "0.00", keluar: "0.00", neto: "0.00" }, pendanaan: { masuk: "0.00", keluar: "0.00", neto: "0.00" }, mutasi: { masuk: "100.00", keluar: "100.00", neto: "0.00" } }, saldo_awal: "0.00", saldo_akhir: "0.00" },
    },
  };
  await page.route("**/api/bumi-lestari/keu/**", route => {
    const request = route.request(), path = new URL(request.url()).pathname.split("/keu")[1];
    if (request.method() === "GET" && path in data) return route.fulfill({ contentType: "application/json", body: JSON.stringify(data[path]) });
    return route.fallback();
  });
  return calls;
}

test("owner mengaktifkan seluruh histori dengan kebijakan tanggal dan FIFO yang disetujui", async ({ page }) => {
  const calls = await ledgerApi(page, false);
  await page.goto("/pengaturan");
  const button = page.getByRole("button", { name: "Aktifkan & Migrasikan Histori" });
  await expect(button).toBeDisabled();
  await page.getByLabel("Konfirmasi aktivasi (AKTIFKAN-BUKU-KEU)").fill("AKTIFKAN-BUKU-KEU");
  await button.click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/buku/aktivasi").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/buku/aktivasi")?.body).toMatchObject({ metode_stok: "fifo", tanggal_status: "updated_at", histori: true, konfirmasi: "AKTIFKAN-BUKU-KEU" });
});

test("mutasi hanya antar akun berbeda, nominal tetap string dan referensi retry tetap", async ({ page }) => {
  const calls = await ledgerApi(page);
  let failed = true;
  await page.route("**/api/bumi-lestari/keu/mutasi", route => {
    if (failed) { failed = false; calls.push({ metode: "POST", path: "/keu/mutasi", body: route.request().postDataJSON(), cari: "" }); return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ detail: "Coba ulang" }) }); }
    return route.fallback();
  });
  await page.goto("/keuangan");
  await page.getByRole("tab", { name: "Buku kas & transfer", exact: true }).click();
  await page.getByRole("button", { name: "Transfer / isi kembali kas", exact: true }).click();
  await page.getByLabel("Akun Kas Asal (Kredit)").selectOption("a");
  await expect(page.getByLabel("Akun Kas Tujuan (Debet)").locator('option[value="a"]')).toHaveCount(0);
  await page.getByLabel("Akun Kas Tujuan (Debet)").selectOption("bank");
  await page.getByLabel("Nominal transfer").fill("9007199254740993.01");
  await page.getByLabel("Biaya admin bank").fill("2.50");
  await page.getByRole("button", { name: "Posting Mutasi Kas" }).click();
  await expect(page.getByRole("alert")).toHaveText("Coba ulang");
  await page.getByRole("button", { name: "Posting Mutasi Kas" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/mutasi").length).toBe(2);
  const attempts = calls.filter(c => c.path === "/keu/mutasi");
  expect(attempts[0].body).toEqual(attempts[1].body);
  expect(attempts[1].body).toMatchObject({ nominal: "9007199254740993.01", biaya_admin: "2.50", akun_asal_id: "a", akun_tujuan_id: "bank" });
});

test("stok non-order utang vendor dan pengambilan FIFO menggunakan endpoint internal", async ({ page }) => {
  const calls = await ledgerApi(page);
  await page.goto("/persediaan");
  await page.getByLabel("Produk stok ready").selectOption("p");
  await page.getByLabel("Asal stok").selectOption("produksi");
  await page.getByLabel("Kuantitas stok masuk").fill("3");
  await page.getByLabel("Biaya total batch").fill("15.01");
  await page.getByLabel("Sumber pembayaran stok").selectOption("utang");
  await page.getByLabel("Vendor stok ready").selectOption("v");
  await page.getByRole("button", { name: "Posting Stok Masuk" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/stok/masuk").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/stok/masuk")?.body).toMatchObject({ qty: 3, biaya_total: "15.01", sumber: "produksi", vendor_id: "v" });
  expect(calls.find(c => c.path === "/keu/stok/masuk")?.body).not.toHaveProperty("akun_kas_id");
  await page.getByLabel("Item pesanan dari stok").selectOption("i");
  await page.getByLabel("Kuantitas pemakaian stok").fill("1");
  await page.getByRole("button", { name: "Posting Pengambilan FIFO" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/stok/keluar").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/stok/keluar")?.body).toMatchObject({ item_id: "i", qty: 1 });
  expect(calls.every(c => c.path.startsWith("/keu/"))).toBe(true);
});

test("tiga laporan memakai tanggal pilihan dan menolak rentang terbalik", async ({ page }) => {
  await ledgerApi(page);
  const ranges: string[] = [];
  page.on("request", request => { if (request.url().includes("/keu/laporan-keuangan?")) ranges.push(new URL(request.url()).search); });
  await page.goto("/laporan-keuangan");
  await page.getByLabel("Tanggal awal laporan").fill("2026-10-01");
  await page.getByLabel("Tanggal akhir laporan").fill("2026-10-06");
  await expect(page.getByRole("heading", { name: "Laba Bersih / SHU" })).toBeVisible();
  await page.getByRole("tab", { name: "Laporan Posisi Keuangan" }).click();
  await expect(page.getByText("Aset = Kewajiban + Ekuitas")).toBeVisible();
  await page.getByRole("tab", { name: "Laporan Arus Kas" }).click();
  await expect(page.getByText("Mutasi internal antar akun", { exact: true })).toBeVisible();
  expect(ranges.some(range => range.includes("tanggal_awal=2026-10-01") && range.includes("tanggal_akhir=2026-10-06"))).toBe(true);
  const count = ranges.length;
  await page.getByLabel("Tanggal awal laporan").fill("2026-10-07");
  await expect(page.getByRole("alert")).toContainText("tanggal awal tidak boleh melebihi");
  await expect(page.getByRole("heading", { name: "Arus Kas", exact: true })).toHaveCount(0);
  expect(ranges.length).toBe(count);
});

test("rekonsiliasi escrow menyimpan tanggal konfirmasi internal", async ({ page }) => {
  const calls = await ledgerApi(page);
  await page.goto("/piutang");
  await page.getByRole("button", { name: "Rekonsiliasi TEST-1" }).click();
  await page.getByLabel("Tanggal piutang TEST-1").fill("2026-10-07");
  await page.getByLabel("Posisi piutang TEST-1").selectOption("escrow");
  await page.getByRole("button", { name: "Konfirmasi Piutang" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/piutang/rekonsiliasi").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/piutang/rekonsiliasi")?.body).toMatchObject({ pesanan_id: "o", tanggal: "2026-10-07", posisi: "escrow" });
});

test("settlement Store mewajibkan bukti dan mencatat tanpa API pembayaran", async ({ page }) => {
  const calls = await ledgerApi(page);
  await page.route("**/api/bumi-lestari/keu/saluran?**", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(pageOf([{ id: "store", nama: "Store", sistem: "store", aktif: true }])) }));
  await page.goto("/keuangan?tab=utama");
  await page.getByRole("tab", { name: "Penerimaan & pencairan", exact: true }).click();
  await page.getByRole("button", { name: "Tambah pencairan", exact: true }).click();
  await page.getByLabel("Saluran settlement").selectOption("store");
  await expect(page.getByLabel("Bukti pencairan (wajib untuk Store)")).toHaveAttribute("required", "");
  await page.getByLabel("Bruto", { exact: true }).fill("20");
  await page.getByLabel("Potongan", { exact: true }).fill("2");
  await page.getByLabel("Neto", { exact: true }).fill("18");
  await page.getByRole("button", { name: "Simpan draf settlement" }).click();
  expect(calls.filter(c => c.path.includes("settlement")).length).toBe(0);
  await page.getByLabel("Bukti pencairan (wajib untuk Store)").fill("BANK-2026-001");
  await page.getByRole("button", { name: "Simpan draf settlement" }).click();
  await expect.poll(() => calls.filter(c => c.path === "/keu/settlement/manual-bukti").length).toBe(1);
  expect(calls.find(c => c.path === "/keu/settlement/manual-bukti")?.body).toMatchObject({ saluran_id: "store", bukti_pencairan: "BANK-2026-001", bruto: "20", potongan: "2", neto: "18" });
  expect(calls.every(c => c.path.startsWith("/keu/"))).toBe(true);
});

test("unpost jurnal mutasi menyimpan alasan dan menghilang dari daftar aktif", async ({ page }) => {
  await ledgerApi(page);
  let cancelled = false;
  const bodies: unknown[] = [];
  const journal = { id: "j", jenis: "mutasi", tanggal: "2026-10-06", status: "terkirim", keterangan: "Mutasi Bank", baris: [{ id: "l", coa_id: "cash", debet: "0", kredit: "100" }] };
  await page.route("**/api/bumi-lestari/keu/jurnal**", route => {
    const request = route.request();
    if (request.method() === "POST") { bodies.push(request.postDataJSON()); cancelled = true; return route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...journal, status: "dibatalkan" }) }); }
    const history = new URL(request.url()).searchParams.get("status") === "batal";
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(pageOf(cancelled === history ? [{ ...journal, status: cancelled ? "dibatalkan" : "terkirim", alasan_batal: cancelled ? "Koreksi Bank" : "" }] : [])) });
  });
  await page.goto("/keuangan");
  await page.getByRole("tab", { name: "Buku kas & transfer", exact: true }).click();
  const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Jurnal Buku Besar", exact: true }) });
  await panel.getByText("Rincian debet / kredit").click();
  await expect(panel.getByText(/Kas · Debet/)).toBeVisible();
  await panel.getByRole("button", { name: "Batalkan Post", exact: true }).click();
  await panel.getByLabel("Alasan pembatalan").fill("Koreksi Bank");
  await panel.getByRole("button", { name: "Konfirmasi Batal Post" }).click();
  await expect(panel.getByText("Belum ada data.")).toBeVisible();
  expect(bodies).toEqual([{ alasan: "Koreksi Bank" }]);
  await panel.getByRole("button", { name: "Jurnal Dibatalkan" }).click();
  await expect(panel.getByText("Koreksi Bank")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Batalkan Post", exact: true })).toHaveCount(0);
});

test("staff ditolak dari ketiga halaman ledger baru", async ({ page }) => {
  await pasangApiTiruan(page, { peran: "staff" });
  for (const route of ["/persediaan", "/piutang", "/laporan-keuangan"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Persediaan Stok Ready", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Piutang Pengiriman & Escrow", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "Laporan keuangan" })).toHaveCount(0);
  }
});
