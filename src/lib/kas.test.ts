import { describe, expect, it } from "vitest";
import { pisahKas, saldoRendah } from "./kas";

describe("kas", () => {
  it("saldo rendah bila < 20% plafon", () => {
    expect(saldoRendah(599_999, 3_000_000)).toBe(true);
    expect(saldoRendah(600_000, 3_000_000)).toBe(false);
    expect(saldoRendah(0, 0)).toBe(false);
  });
  it("Dana cadangan dipisah dari kas yang bisa dipakai", () => {
    const akun = [
      { kode: "KAS_UTAMA", saldo: "3400000.00" },
      { kode: "DANA_CADANGAN", saldo: "1000000.00" },
    ];
    expect(pisahKas("4400000", akun)).toEqual({ bisaDipakai: 3_400_000, cadangan: 1_000_000 });
    expect(pisahKas("500", [])).toEqual({ bisaDipakai: 500, cadangan: 0 });
  });
});
