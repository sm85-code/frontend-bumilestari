import { expect, test, type Page } from "@playwright/test";
import { dialogKonfirmasi, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2: tutup buku bulanan, bagi hasil dari laba terkunci, koreksi bulan lalu. */

// Halaman memakai "bulan lalu" sebagai bawaan: kunci jam peramban di awal Oktober 2026.
const jamOktober = (page: Page) => page.clock.setFixedTime(new Date("2026-10-06T10:00:00+07:00"));

const kesiapanSiap = {
  periode: "2026-09", status: "terbuka", boleh_tutup: true, belum_cair: "0",
  butir: [
    { kode: "bulan_berakhir", label: "Bulan sudah berakhir", siap: true, penghalang: true, keterangan: "" },
    { kode: "cek_fisik", label: "Cek fisik kas kecil", siap: false, penghalang: false, keterangan: "Belum ada catatan cek fisik" },
  ],
  pratinjau: { pemasukan: [], biaya: [], di_luar_laba: [], total_pemasukan: "10000000", total_biaya: "1900000", laba_bersih: "8100000" },
};

test("tutup buku: daftar kesiapan, tombol terkunci bila ada penghalang", async ({ page }) => {
  await jamOktober(page);
  await pasangApiTiruan(page);
  await page.goto("/laporan/tutup-buku");
  await expect(page.locator('[data-butir="gaji"]')).toContainText("Belum dibayar: Sari");
  await expect(page.locator('[data-butir="cek_fisik"]')).toContainText("Cek fisik kas kecil");
  await expect(page.getByRole("button", { name: "Tutup buku September 2026" })).toBeDisabled();
  await expect(page.locator(".ant-card", { hasText: "Riwayat tutup buku" })).toContainText("Agustus 2026");
});

test("tutup buku: semua siap → konfirmasi → POST tutup", async ({ page }) => {
  await jamOktober(page);
  const panggilan = await pasangApiTiruan(page, { data: { "/tutup-buku/2026-09/kesiapan": kesiapanSiap } });
  await page.goto("/laporan/tutup-buku");
  await page.getByRole("button", { name: "Tutup buku September 2026" }).click();
  const dlg = await dialogKonfirmasi(page);
  await expect(dlg).toContainText("Rp8.100.000");
  await dlg.getByRole("button", { name: "Tutup buku September 2026" }).click();
  await expect.poll(() => panggilan.some((p) => p.metode === "POST" && p.path === "/tutup-buku/2026-09")).toBe(true);
});

test("tutup buku: buka darurat wajib alasan", async ({ page }) => {
  await jamOktober(page);
  const panggilan = await pasangApiTiruan(page, {
    data: {
      "/tutup-buku/2026-09/kesiapan": { ...kesiapanSiap, status: "ditutup", boleh_tutup: false },
      "/tutup-buku": [{ id: "tb9", periode: "2026-09", status: "ditutup", ditutup_oleh: "u1", ditutup_pada: "2026-10-05T03:00:00Z", dibuka_oleh: null, dibuka_pada: null, alasan_buka: null, laba_bersih: "8100000" }],
    },
  });
  await page.goto("/laporan/tutup-buku");
  await expect(page.getByText(/September 2026 sudah tutup buku/)).toBeVisible();
  await page.getByRole("button", { name: "Buka darurat" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("salah input omzet");
  await dlg.getByRole("button", { name: "Buka darurat" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/tutup-buku/2026-09/buka")).toEqual({ alasan: "salah input omzet" });
});

test("owner melihat kesiapan tanpa tombol tutup buku", async ({ page }) => {
  await jamOktober(page);
  await pasangApiTiruan(page, { peran: "owner" });
  await page.goto("/laporan/tutup-buku");
  await expect(page.locator('[data-butir="gaji"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Tutup buku September/ })).toHaveCount(0);
});

test("bagi hasil: pratinjau belum bisa disimpan sebelum tutup buku; laba terkunci bisa disimpan", async ({ page }) => {
  await jamOktober(page);
  await pasangApiTiruan(page);
  await page.goto("/bagi-hasil");
  await expect(page.getByText("Pratinjau September 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan perhitungan" })).toBeDisabled();
  await expect(page.locator(".ant-alert").getByRole("link", { name: "Tutup buku" })).toBeVisible();
});

test("bagi hasil: bulan sudah tutup buku → simpan perhitungan", async ({ page }) => {
  await jamOktober(page);
  const panggilan = await pasangApiTiruan(page, {
    data: { "/bagi-hasil/hitung": { periode: "2026-09", pemasukan: "10000000", pengeluaran: "1900000", laba_bersih: "8100000", persen_admin: "40", persen_owner: "60", bagian_admin: "3240000", bagian_owner: "4860000", final: true } },
  });
  await page.goto("/bagi-hasil");
  await expect(page.getByText("Laba terkunci September 2026")).toBeVisible();
  await page.getByRole("button", { name: "Simpan perhitungan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/bagi-hasil")).toEqual({ periode: "2026-09" });
});

test("catat transaksi: koreksi bulan yang sudah tutup buku", async ({ page }) => {
  await jamOktober(page);
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/kas-kecil");
  await page.getByRole("radio", { name: "Transport" }).click();
  await page.getByLabel("Jumlah").fill("20000");
  await page.getByRole("combobox", { name: "Koreksi bulan lalu" }).click();
  const opsi = page.locator(".ant-select-dropdown:visible .ant-select-item-option");
  await expect(opsi).toHaveText(["Bukan koreksi", "Koreksi Agustus 2026"]);
  await opsi.filter({ hasText: "Koreksi Agustus 2026" }).click();
  await page.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transaksi")).toMatchObject({ jumlah: "20000", koreksi_periode: "2026-08" });
});

test("order: lencana cair/belum cair dan retur sebelum cair", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page);
  await page.goto("/order");
  const belum = page.locator("tr", { hasText: "SHP-777" });
  await expect(belum.getByText("belum cair", { exact: true })).toBeVisible();
  const cair = page.locator("tr", { hasText: "SHP-888" });
  await expect(cair.getByText("cair 27/09/2026")).toBeVisible();
  await expect(cair.getByRole("button", { name: "Retur" })).toHaveCount(0); // sudah cair: lewat file pencairan
  await expect(page.locator("tr", { hasText: "260922PJ9B35EN" }).first().getByRole("button", { name: "Retur" })).toHaveCount(0); // penjual lain

  await belum.getByRole("button", { name: "Retur" }).click();
  const dlg = page.locator(".ant-modal", { hasText: "Retur order SHP-777" });
  await expect(dlg.getByRole("button", { name: "Tandai retur" })).toBeDisabled();
  await dlg.getByLabel("Alasan retur").fill("rusak saat dikirim");
  await dlg.getByRole("checkbox").check();
  await dlg.getByRole("button", { name: "Tandai retur" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/order/o3/retur")).toMatchObject({ alasan: "rusak saat dikirim", kembali_stok: true });
});

test("laporan belum cair per saluran", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/laporan/belum-cair");
  await expect(page.getByText("Shopee: 1 order, perkiraan cair Rp905.000")).toBeVisible();
  await expect(page.locator('[data-saluran="Shopee"]')).toContainText("SHP-777");
});

test("laba rugi menampilkan belum cair sebagai informasi", async ({ page }) => {
  await pasangApiTiruan(page, {
    data: {
      "/laporan/umum": {
        dari: "2026-09-01", sampai: "2026-09-30", pemasukan: [], total_pemasukan: "0", biaya: [], total_biaya: "0", laba_bersih: "100000",
        di_luar_laba: [], arus_kas: [], total_kas_awal: "0", total_kas_akhir: "0", belum_cair: "905000", perkiraan_laba_jika_cair: "1005000",
      },
    },
  });
  await page.goto("/laporan");
  const bc = page.locator("[data-belum-cair]");
  await expect(bc).toContainText("Rp905.000");
  await expect(bc).toContainText("Perkiraan laba jika semua cair");
  await expect(bc).toContainText("Rp1.005.000");
});
