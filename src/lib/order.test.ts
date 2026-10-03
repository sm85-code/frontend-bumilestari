import { describe, expect, it } from "vitest";
import { alurStatus, bolehRetur, statusBerikut } from "./order";

describe("alur status order", () => {
  it("kayu dicat melewati langkah dicat", () => {
    expect(alurStatus("kayu", true)).toEqual(["dipesan", "dikerjakan", "diambil", "dicat", "dikirim", "selesai"]);
    expect(statusBerikut({ status: "diambil", butuh_cat: true }, "kayu")).toBe("dicat");
  });
  it("kayu polos melewati langkah dicat", () => {
    expect(statusBerikut({ status: "diambil", butuh_cat: false }, "kayu")).toBe("dikirim");
  });
  it("non kayu: dipesan -> diterima -> dikirim -> selesai", () => {
    expect(statusBerikut({ status: "dipesan", butuh_cat: false }, "non_kayu")).toBe("diterima");
    expect(statusBerikut({ status: "diterima", butuh_cat: false }, "non_kayu")).toBe("dikirim");
  });
  it("selesai dan batal tidak punya langkah berikut", () => {
    expect(statusBerikut({ status: "selesai", butuh_cat: true }, "kayu")).toBeNull();
    expect(statusBerikut({ status: "batal", butuh_cat: true }, "kayu")).toBeNull();
  });
});

describe("retur sebelum cair", () => {
  const mp = { jenis: "marketplace" as const };
  it("hanya order marketplace/Toko web yang sudah dikirim dan belum cair", () => {
    expect(bolehRetur({ status: "dikirim", status_cair: "belum" }, mp)).toBe(true);
    expect(bolehRetur({ status: "selesai" }, { jenis: "web" })).toBe(true);
    expect(bolehRetur({ status: "dikirim", status_cair: "cair" }, mp)).toBe(false);
    expect(bolehRetur({ status: "diambil" }, mp)).toBe(false);
    expect(bolehRetur({ status: "dikirim" }, { jenis: "reseller" })).toBe(false);
    expect(bolehRetur({ status: "retur" }, mp)).toBe(false);
  });
  it("order retur tidak punya langkah berikutnya", () => {
    expect(statusBerikut({ status: "retur", butuh_cat: false }, "kayu")).toBeNull();
  });
});
