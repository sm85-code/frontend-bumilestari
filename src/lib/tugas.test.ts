import { describe, expect, it } from "vitest";
import { awalBulan, daftarTugas, periodeSebelum, type InputTugas } from "./tugas";

const dasar: InputTugas = {
  hariIni: "2026-10-20",
  selasa: "2026-10-20",
  selasaBeres: 5,
  selasaTotal: 5,
  utangTukang: 0,
  tukangSudahDibayar: false,
  tagihanPenjualLain: 0,
  jumlahInvoice: 0,
  periodeLalu: "2026-09",
  cekFisikSelesai: false,
};

describe("daftarTugas", () => {
  it("kosong bila semua beres dan bukan awal bulan", () => {
    expect(daftarTugas(dasar)).toEqual([]);
  });
  it("Selasa, tukang, penjual lain, saldo rendah", () => {
    const ids = daftarTugas({
      ...dasar,
      selasaBeres: 2,
      utangTukang: 500000,
      tagihanPenjualLain: 300000,
      jumlahInvoice: 1,
      kasKecil: { saldo: "500000", plafon: "3000000", perlu_diisi: "2500000" },
      kasIklan: { saldo: "1500000", plafon: "2000000", perlu_diisi: "500000" },
    }).map((t) => t.id);
    expect(ids).toEqual(["selasa", "tukang", "penjual-lain", "kas-kecil"]);
    expect(daftarTugas({ ...dasar, utangTukang: 500000, tukangSudahDibayar: true })).toEqual([]);
  });
  it("tugas awal bulan", () => {
    const t = daftarTugas({ ...dasar, hariIni: "2026-10-03", gajiBelumDibayar: true, tagihanRutinBelum: 2 });
    expect(t.map((x) => x.id)).toEqual(["gaji", "tagihan", "cek-fisik"]);
    expect(t[0].teks).toContain("September 2026");
    expect(daftarTugas({ ...dasar, hariIni: "2026-10-03", cekFisikSelesai: true })).toEqual([]);
  });
  it("helper tanggal", () => {
    expect(awalBulan("2026-10-10")).toBe(true);
    expect(awalBulan("2026-10-11")).toBe(false);
    expect(periodeSebelum("2026-01-05")).toBe("2025-12");
    expect(periodeSebelum("2026-10-05")).toBe("2026-09");
  });
});
