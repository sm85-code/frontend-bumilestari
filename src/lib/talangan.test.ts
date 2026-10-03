import { describe, expect, it } from "vitest";
import { kekuranganSaldo, perOrang } from "./talangan";
import type { AkunKas, Talangan } from "./types";

const kas = { id: "a3", kode: "KAS_KECIL", nama: "Kas kecil", jenis: "kas_kecil", plafon: "3000000", saldo: "100000", saldo_setelah_draf: "80000" } as AkunKas;

describe("talangan", () => {
  it("kekurangan dihitung dari uang fisik (setelah draf), hanya pengeluaran akun imprest", () => {
    expect(kekuranganSaldo(kas, "keluar", 50000)).toBe(0);
    expect(kekuranganSaldo(kas, "keluar", 100000)).toBe(20000);
    expect(kekuranganSaldo(kas, "masuk", 999999)).toBe(0);
    expect(kekuranganSaldo({ ...kas, jenis: "kas" }, "keluar", 999999)).toBe(0);
    expect(kekuranganSaldo({ ...kas, saldo_setelah_draf: "-5000" }, "keluar", 1000)).toBe(1000);
  });
  it("dikelompokkan per orang, sisa terbesar dulu", () => {
    const t = (nama: string, sisa: string) => ({ nama, sisa }) as Talangan;
    const g = perOrang([t("Sari", "1000"), t("Budi", "5000"), t("Sari", "2000")]);
    expect(g.map(([n, s, l]) => [n, s, l.length])).toEqual([["Budi", 5000, 1], ["Sari", 3000, 2]]);
  });
});
