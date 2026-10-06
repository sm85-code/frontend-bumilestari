import { describe, expect, it } from "vitest";
import { money, multiplyMoney } from "./api";

describe("keu decimal precision", () => {
  it("preserves cents beyond JS safe integers", () => {
    expect(money("9007199254740993.01")).toBe("Rp 9.007.199.254.740.993,01");
    expect(multiplyMoney("9007199254740993.01", 2)).toBe("18014398509481986.02");
    expect(multiplyMoney("0.01", 3)).toBe("0.03");
    expect(money("-0.01")).toBe("-Rp 0,01");
  });
  it("rejects invalid prices and fractional quantities", () => {
    for (const input of ["NaN", "1,23", "-1", "1.001"]) expect(() => multiplyMoney(input, 1)).toThrow();
    expect(() => multiplyMoney("1.00", 1.5)).toThrow();
  });
});
