import { expect, test, type Page } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";
import type { Vendor } from "../src/baru/keu/types";

function vendor(index: number, active = true): Vendor {
  return { id: `v-${index}`, kode: `VND-${index}`, nama: `Vendor ${index}`, tipe: "kayu", jenis: "tukang_kayu", kontak: "", alamat: "", keterangan: "", aktif: active, status: active ? "aktif" : "non_aktif" };
}

async function vendorApi(page: Page, initial: Vendor[]) {
  const calls = await pasangApiTiruan(page);
  const rows = [...initial];
  const requests: { method: string; offset: number; body: Record<string, unknown> | null }[] = [];
  await page.route("**/api/bumi-lestari/keu/vendor**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : null;
    requests.push({ method: request.method(), offset, body });
    let result: unknown;
    if (request.method() === "GET") {
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const filtered = rows.filter(v => `${v.nama} ${v.kode} ${v.kontak} ${v.alamat}`.toLowerCase().includes(search));
      const limit = Number(url.searchParams.get("limit") ?? 50);
      result = { rows: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset };
    } else if (request.method() === "POST") {
      const next = { ...vendor(999), ...body, kode: body?.kode || "VND-AUTO", id: "new-vendor" } as Vendor;
      next.jenis = next.tipe === "kayu" ? "tukang_kayu" : "supplier";
      rows.push(next);
      result = next;
    } else {
      const id = url.pathname.split("/").at(-1);
      const existing = rows.find(v => v.id === id)!;
      Object.assign(existing, request.method() === "DELETE" ? { aktif: false } : body);
      existing.jenis = existing.tipe === "kayu" ? "tukang_kayu" : "supplier";
      existing.status = existing.aktif ? "aktif" : "non_aktif";
      result = existing;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(result), status: request.method() === "POST" ? 201 : 200 });
  });
  return { rows, requests, calls };
}

test("vendor ditambah dengan kode otomatis, diedit, dinonaktifkan dan diaktifkan", async ({ page }) => {
  const api = await vendorApi(page, [vendor(1)]);
  await page.goto("/pengaturan");
  await page.getByRole("button", { name: "+ Tambah Vendor", exact: true }).click();
  await page.getByLabel("Nama vendor", { exact: true }).fill("Supplier baru");
  await page.getByLabel("Tipe vendor", { exact: true }).selectOption("non_kayu");
  await page.getByLabel("Kontak / WhatsApp", { exact: true }).fill("08123456789");
  await page.getByLabel("Alamat vendor", { exact: true }).fill("Jl. Supplier 10");
  await page.getByLabel("Keterangan vendor", { exact: true }).fill("Bahan produksi");
  await page.getByRole("button", { name: "Simpan vendor", exact: true }).click();
  await expect(page.getByText("Vendor berhasil disimpan.")).toBeVisible();
  await expect(page.getByRole("cell", { name: "VND-AUTO", exact: true })).toBeVisible();
  expect(api.requests.find(r => r.method === "POST")?.body).toEqual({ kode: null, nama: "Supplier baru", tipe: "non_kayu", kontak: "08123456789", alamat: "Jl. Supplier 10", keterangan: "Bahan produksi" });
  await page.getByRole("button", { name: "Edit Supplier baru", exact: true }).click();
  await expect(page.getByLabel("Alamat vendor", { exact: true })).toHaveValue("Jl. Supplier 10");
  await page.getByLabel("Nama vendor", { exact: true }).fill("Supplier diperbarui");
  await page.getByRole("button", { name: "Simpan vendor", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Supplier diperbarui", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nonaktifkan Supplier diperbarui", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Nonaktif", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Aktifkan Supplier diperbarui", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nonaktifkan Supplier diperbarui", exact: true })).toBeVisible();
  expect(api.requests.filter(r => r.method === "DELETE")).toHaveLength(1);
});

test("daftar vendor memiliki pagination dan pencarian serta kode manual", async ({ page }) => {
  const api = await vendorApi(page, Array.from({ length: 60 }, (_, i) => vendor(i)));
  await page.goto("/pengaturan");
  const master = page.getByRole("heading", { name: "Master vendor", exact: true }).locator("..");
  await master.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(master.getByRole("cell", { name: "Vendor 59", exact: true })).toBeVisible();
  await page.getByLabel("Cari vendor", { exact: true }).fill("VND-59");
  await expect(master.getByText("1–1 dari 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+ Tambah Vendor", exact: true }).click();
  await page.getByLabel("Kode vendor", { exact: true }).fill("TK-MANUAL");
  await page.getByLabel("Nama vendor", { exact: true }).fill("Tukang baru");
  await page.getByRole("button", { name: "Simpan vendor", exact: true }).click();
  await expect(page.getByText("Vendor berhasil disimpan.")).toBeVisible();
  expect(api.requests.find(r => r.method === "POST")?.body?.kode).toBe("TK-MANUAL");
  expect(api.requests.some(r => r.method === "GET" && r.offset === 50)).toBe(true);
});

test("produksi membaca lebih dari 200 vendor dan menyembunyikan vendor nonaktif", async ({ page }) => {
  const rows = Array.from({ length: 205 }, (_, i) => vendor(i, i !== 1));
  const api = await vendorApi(page, rows);
  await page.goto("/produksi");
  const choice = page.getByLabel("Vendor", { exact: true });
  await expect(choice.locator("option")).toHaveCount(205); // 204 active vendors plus the placeholder.
  await expect(choice.locator('option[value="v-1"]')).toHaveCount(0);
  await choice.selectOption("v-204");
  await page.getByLabel("Item pesanan", { exact: true }).selectOption("i");
  await page.getByLabel("Biaya per unit", { exact: true }).fill("5.00");
  await page.getByRole("button", { name: "Simpan alokasi", exact: true }).click();
  await expect.poll(() => api.calls.find(c => c.path === "/keu/alokasi-vendor")?.body).toMatchObject({ item_id: "i", vendor_id: "v-204", qty: 1, biaya_satuan: "5.00" });
  expect(api.requests.some(r => r.method === "GET" && r.offset === 200)).toBe(true);
});
