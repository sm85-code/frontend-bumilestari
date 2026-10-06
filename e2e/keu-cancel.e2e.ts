import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";
import { keuFixtures } from "./keu-fixtures";

test("batalkan draf, sembunyikan pengerjaan dan lihat riwayat readonly", async ({ page }) => {
  await pasangApiTiruan(page);
  const order = keuFixtures()["/keu/pesanan"].rows[0] as { id: string; nomor: string; status: string; items: unknown[] };
  const bodies: unknown[] = [];
  const filters: string[] = [];
  await page.route("**/api/bumi-lestari/keu/pesanan**", async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === "POST" && url.pathname.endsWith(`/pesanan/${order.id}/status`)) {
      bodies.push(request.postDataJSON()); order.status = "batal";
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(order) });
    }
    if (request.method() === "GET" && url.pathname.endsWith("/pesanan")) {
      const status = url.searchParams.get("status") ?? "pengerjaan";
      filters.push(status);
      const rows = status === "batal" ? order.status === "batal" ? [order] : [] : order.status !== "batal" ? [order] : [];
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ rows, total: rows.length, limit: 50, offset: 0 }) });
    }
    return route.fallback();
  });
  await page.goto("/order");
  await page.getByRole("button", { name: "Abaikan / Batalkan TEST-1" }).click();
  await page.getByLabel("Alasan pembatalan TEST-1").fill("Transaksi tidak perlu dikerjakan");
  await page.getByRole("button", { name: "Konfirmasi pembatalan" }).click();
  await expect(page.getByText("Belum ada data.")).toBeVisible();
  expect(bodies).toEqual([{ status: "batal", alasan: "Transaksi tidak perlu dikerjakan" }]);
  await page.getByRole("tab", { name: "Dibatalkan", exact: true }).click();
  await expect(page.getByText("TEST-1 · 2026-10-06")).toBeVisible();
  await expect(page.getByText(/Produksi: Dibatalkan/)).toBeVisible();
  await expect(page.getByLabel("Produk Kayu Test")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Abaikan / Batalkan TEST-1" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mulai produksi" })).toHaveCount(0);
  expect(filters).toContain("batal");
  await page.getByRole("tab", { name: "Pengerjaan", exact: true }).click();
  await expect(page.getByText("Belum ada data.")).toBeVisible();
});

test("pembatalan ditolak mempertahankan pesanan dan alasan", async ({ page }) => {
  const calls = await pasangApiTiruan(page, { galat: { "/keu/pesanan/o/status": { status: 409, detail: "Batalkan alokasi terlebih dahulu; settlement harus dikoreksi terpisah" } } });
  await page.goto("/order");
  await page.getByRole("button", { name: "Abaikan / Batalkan TEST-1" }).click();
  await page.getByLabel("Alasan pembatalan TEST-1").fill("   ");
  await page.getByRole("button", { name: "Konfirmasi pembatalan" }).click();
  await expect(page.getByRole("alert")).toHaveText("Isi alasan pembatalan minimal 3 karakter.");
  expect(calls.filter(call => call.path === "/keu/pesanan/o/status")).toHaveLength(0);
  await page.getByLabel("Alasan pembatalan TEST-1").fill("Abaikan transaksi");
  await page.getByRole("button", { name: "Konfirmasi pembatalan" }).click();
  await expect(page.getByRole("alert")).toHaveText("Batalkan alokasi terlebih dahulu; settlement harus dikoreksi terpisah");
  await expect(page.getByLabel("Alasan pembatalan TEST-1")).toHaveValue("Abaikan transaksi");
  await expect(page.getByText("TEST-1 · 2026-10-06")).toBeVisible();
  expect(calls.filter(call => call.path === "/keu/pesanan/o/status")).toHaveLength(1);
});
