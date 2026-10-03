import { describe, expect, it } from "vitest";
import { ringkasDraf, sumberUntuk, teksDraf } from "./kiriman";
import type { DrafSumber } from "./types";

const d = (sumber: DrafSumber["sumber"], jumlah_entri: number, total: string, tanggal_tertua: string | null): DrafSumber => ({
  sumber,
  label: sumber,
  jumlah_entri,
  total_masuk: "0",
  total_keluar: total,
  total,
  tanggal_tertua,
  entri: [],
});

describe("kiriman (posting berkelompok)", () => {
  it("ringkasDraf menjumlah entri, total, dan tanggal tertua", () => {
    const r = ringkasDraf([d("kas_kecil", 2, "40000", "2026-09-24"), d("pembayaran_pemasok", 1, "500000", "2026-09-22"), d("kas_iklan", 0, "0", null)]);
    expect(r).toEqual({ jumlah: 3, total: 540000, tertua: "2026-09-22" });
    expect(ringkasDraf(undefined)).toEqual({ jumlah: 0, total: 0, tertua: null });
  });
  it("teksDraf", () => {
    expect(teksDraf({ jumlah: 0, total: 0, tertua: null })).toBe("Tidak ada catatan draf.");
    expect(teksDraf({ jumlah: 2, total: 40000, tertua: "2026-09-24" })).toBe("2 catatan draf senilai Rp40.000, paling lama 24/09/2026");
  });
  it("kas iklan hanya untuk admin", () => {
    expect(sumberUntuk(true)).toContain("kas_iklan");
    expect(sumberUntuk(false)).toEqual(["kas_kecil", "penerimaan_reseller", "pembayaran_pemasok"]);
  });
});
