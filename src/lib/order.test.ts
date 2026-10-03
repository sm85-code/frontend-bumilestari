import { describe, expect, it } from "vitest";
import { alurStatus, statusBerikut } from "./order";

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
