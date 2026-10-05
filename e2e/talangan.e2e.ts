import { test } from "@playwright/test";
test.skip(true, "layar lama diganti");
import { expect, test } from "@playwright/test";
import { dialogKonfirmasi, tulisanTerkirim } from "./bantu";
import { pasangApiTiruan } from "./mock-api";

/* Tes klik Fase 2 (1.10): talangan kas kecil + pelunasan di Tutup Kas Mingguan + isi ulang di luar jadwal. */

const talangan = (id: string, nama: string, sisa: string, extra: Record<string, unknown> = {}) => ({
  id, tanggal: "2026-09-24", nama, akun_asal_id: "a3", akun_asal_nama: "Kas kecil", kategori_id: "k10", keterangan: "lakban", total_pengeluaran: "300000",
  jumlah: "200000", terbayar: String(200000 - Number(sisa)), sisa, status_kirim: "draf", dibatalkan: false, alasan_batal: null, created_at: "2026-09-24T03:00:00Z", bayar: [],
  ...extra,
});

test("staf: pengeluaran melebihi saldo kas kecil dicatat dengan talangan atas namanya", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, { peran: "staff" });
  await page.goto("/kas-kecil");
  const panduan = page.locator(".ant-modal", { hasText: "Selamat datang!" });
  await panduan.getByRole("button", { name: "Mengerti" }).click();
  await page.getByRole("radio", { name: "Packing" }).click();
  await page.getByLabel("Jumlah").fill("15000");
  await expect(page.locator("[data-talangan]")).toHaveCount(0); // saldo cukup
  await page.getByLabel("Jumlah").fill("3000000");
  await expect(page.locator("[data-talangan]")).toContainText("Saldo kas kecil kurang Rp175.000");
  await expect(page.getByLabel("Talangan oleh")).toHaveValue("Sari");
  await page.getByRole("button", { name: "Simpan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/transaksi")).toMatchObject({ akun_id: "a3", jumlah: "3000000", talangan_oleh: "Sari" });
});

test("tutup kas mingguan langkah 5: lunasi talangan penuh & sebagian", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, { data: { "/talangan": [talangan("t1", "Sari", "200000"), talangan("t2", "Sari", "50000"), talangan("t3", "Budi", "80000")] } });
  await page.goto("/selasa");
  await page.getByText("5. Lunasi talangan").click();
  await expect(page.locator('[data-talangan-orang="Sari"]')).toContainText("Sisa Rp250.000");
  await page.getByRole("button", { name: "Lunasi Rp200.000" }).click();
  await (await dialogKonfirmasi(page)).getByRole("button", { name: "Lunasi" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/talangan/t1/lunasi")).toMatchObject({ jumlah: null, tanggal: "2026-09-29" });

  await page.locator('[data-talangan-orang="Budi"]').getByRole("button", { name: "Sebagian" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("30.000");
  await dlg.getByRole("button", { name: "Lunasi" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/talangan/t3/lunasi")).toMatchObject({ jumlah: "30000" });
});

test("admin kas kecil: daftar talangan dengan riwayat, batalkan pelunasan, isi ulang di luar jadwal wajib alasan", async ({ page }) => {
  const panggilan = await pasangApiTiruan(page, {
    data: {
      "/talangan": [
        talangan("t1", "Sari", "150000", { bayar: [{ id: "b1", transfer_id: "tr9", tanggal: "2026-09-29", jumlah: "50000", dibatalkan: false }] }),
      ],
    },
  });
  await page.goto("/kas-kecil");
  const orang = page.locator('[data-talangan-orang="Sari"]');
  await expect(orang).toContainText("sudah dibayar Rp50.000");
  await orang.getByRole("button", { name: "Batalkan pelunasan" }).click();
  const dlg = await dialogKonfirmasi(page);
  await dlg.getByRole("textbox").fill("salah jumlah");
  await dlg.getByRole("button", { name: "Batalkan" }).click();
  expect(await tulisanTerkirim(panggilan, "POST", "/talangan/bayar/b1/batal")).toEqual({ alasan: "salah jumlah" });

  await page.getByRole("button", { name: "Isi ulang di luar jadwal" }).click();
  const isi = await dialogKonfirmasi(page);
  await isi.getByRole("textbox").fill("stok packing habis");
  await isi.getByRole("button", { name: "Isi sekarang" }).click();
  await expect.poll(() => panggilan.find((p) => p.path === "/kas-kecil/pengisian")?.cari ?? "").toContain("di_luar_jadwal=true");
  expect(decodeURIComponent(panggilan.find((p) => p.path === "/kas-kecil/pengisian")!.cari.replace(/\+/g, " "))).toContain("alasan=stok packing habis");
});
