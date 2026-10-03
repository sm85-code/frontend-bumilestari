import { describe, expect, it } from "vitest";
import { bersihkanAngka, num, rp, tanggal, tanggalHari } from "./format";

describe("format", () => {
  it("rp memformat rupiah gaya Indonesia", () => {
    expect(rp("1225000.00")).toBe("Rp1.225.000");
    expect(rp(0)).toBe("Rp0");
    expect(rp("-50000")).toBe("-Rp50.000");
    expect(rp(null)).toBe("Rp0");
  });
  it("num menangani string desimal dan kosong", () => {
    expect(num("2000001.00")).toBe(2000001);
    expect(num("")).toBe(0);
    expect(num(undefined)).toBe(0);
  });
  it("tanggal dan hari", () => {
    expect(tanggal("2026-09-26")).toBe("26/09/2026");
    expect(tanggal(null)).toBe("-");
    expect(tanggalHari("2026-09-26")).toBe("26/09/2026 - Sabtu");
    expect(tanggalHari("2026-09-21")).toBe("21/09/2026 - Senin");
  });
  it("bersihkanAngka membuang pemisah", () => {
    expect(bersihkanAngka("Rp 1.500.000")).toBe("1500000");
  });
});
