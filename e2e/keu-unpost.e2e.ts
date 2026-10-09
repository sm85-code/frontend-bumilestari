import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";
import { keuFixtures } from "./keu-fixtures";
import type { Settlement } from "../src/baru/keu/types";

test("batal post menghilang dari kas aktif, tersimpan di riwayat dan membatalkan settlement", async ({ page }) => {
  await pasangApiTiruan(page);
  const tx = { id: "tx", tanggal: "2026-10-06", akun_id: "a", kategori_id: "income", jenis: "masuk", jumlah: "18.00", status: "terkirim", keterangan: "Settlement SET-1", alasan_batal: "", dibatalkan_oleh: "", dibatalkan_at: "" };
  const settlement = { ...(keuFixtures()["/keu/settlement"].rows[0] as Settlement), status: "terkirim" };
  const bodies: unknown[] = [];
  await page.route("**/api/bumi-lestari/keu/**", async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === "POST" && url.pathname.endsWith("/transaksi/tx/unpost")) {
      bodies.push(request.postDataJSON()); tx.status = "dibatalkan"; settlement.status = "dibatalkan";
      tx.alasan_batal = request.postDataJSON().alasan; tx.dibatalkan_oleh = "owner"; tx.dibatalkan_at = "2026-10-06T12:00:00+00:00";
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(tx) });
    }
    if (request.method() === "GET" && (url.pathname.endsWith("/transaksi") || url.pathname.endsWith("/settlement"))) {
      const value = url.pathname.endsWith("/transaksi") ? tx : settlement;
      const history = url.searchParams.get("status") === "batal";
      const rows = (value.status === "dibatalkan") === history ? [value] : [];
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ rows, total: rows.length, limit: 50, offset: 0 }) });
    }
    return route.fallback();
  });
  await page.goto("/keuangan?tab=utama");
  await page.getByRole("tab", { name: "Penerimaan & pencairan", exact: true }).click();
  const cash = page.locator("section").filter({ has: page.getByRole("heading", { name: "Buku kas", exact: true }) });
  const settlements = page.locator("section").filter({ has: page.getByRole("heading", { name: "Rekonsiliasi settlement", exact: true }) });
  await cash.getByRole("button", { name: "Batalkan Post", exact: true }).click();
  await expect(cash.getByRole("button", { name: "Konfirmasi Batal Post" })).toBeDisabled();
  await cash.getByLabel("Alasan pembatalan").fill("Koreksi bukti settlement");
  await cash.getByRole("button", { name: "Konfirmasi Batal Post" }).click();
  await expect(cash.getByText("Belum ada data.")).toBeVisible();
  await expect(settlements.getByText("Belum ada data.")).toBeVisible();
  expect(bodies).toEqual([{ alasan: "Koreksi bukti settlement" }]);
  await cash.getByRole("button", { name: "Riwayat Batal Post", exact: true }).click();
  await expect(cash.getByText("Koreksi bukti settlement")).toBeVisible();
  await expect(cash.getByText("2026-10-06", { exact: true })).toBeVisible();
  await expect(cash.getByRole("button", { name: "Batalkan Post", exact: true })).toHaveCount(0);
  await expect(cash.getByRole("button", { name: "Posting kas" })).toHaveCount(0);
  await settlements.getByRole("button", { name: "Riwayat Settlement Dibatalkan" }).click();
  await expect(settlements.getByText("SET-1", { exact: true })).toBeVisible();
  await expect(settlements.getByRole("button", { name: "Batalkan Post", exact: true })).toHaveCount(0);
});

test("unpost ditolak periode terkunci mempertahankan alasan dan jurnal", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.route("**/api/bumi-lestari/keu/transaksi**", async route => {
    if (route.request().method() === "POST") return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ detail: "Periode sudah ditutup" }) });
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ rows: [{ id: "tx", tanggal: "2026-10-06", akun_id: "a", jenis: "masuk", jumlah: "18.00", status: "terkirim", keterangan: "Jurnal terkunci" }], total: 1, limit: 50, offset: 0 }) });
  });
  await page.goto("/keuangan?tab=utama");
  await page.getByRole("tab", { name: "Penerimaan & pencairan", exact: true }).click();
  await page.getByRole("button", { name: "Batalkan Post", exact: true }).click();
  await page.getByLabel("Alasan pembatalan").fill("Koreksi jurnal terkunci");
  await page.getByRole("button", { name: "Konfirmasi Batal Post" }).click();
  await expect(page.getByRole("alert")).toHaveText("Periode sudah ditutup");
  await expect(page.getByLabel("Alasan pembatalan")).toHaveValue("Koreksi jurnal terkunci");
  await expect(page.getByText("Jurnal terkunci", { exact: true })).toBeVisible();
});

test("settlement neto nol dapat dibatalkan langsung", async ({ page }) => {
  const calls = await pasangApiTiruan(page);
  await page.route("**/api/bumi-lestari/keu/settlement?**", async route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ rows: [{ ...(keuFixtures()["/keu/settlement"].rows[0] as Settlement), neto: "0.00", status: "terkirim" }], total: 1, limit: 50, offset: 0 }) }));
  await page.goto("/keuangan?tab=utama");
  await page.getByRole("tab", { name: "Penerimaan & pencairan", exact: true }).click();
  await page.getByRole("button", { name: "Batalkan Post", exact: true }).click();
  await page.getByLabel("Alasan pembatalan").fill("Koreksi neto nol");
  await page.getByRole("button", { name: "Konfirmasi Batal Post" }).click();
  await expect.poll(() => calls.filter(call => call.path === "/keu/settlement/st/unpost").length).toBe(1);
  expect(calls.find(call => call.path === "/keu/settlement/st/unpost")?.body).toEqual({ alasan: "Koreksi neto nol" });
});
