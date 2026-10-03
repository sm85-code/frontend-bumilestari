import { describe, expect, it } from "vitest";
import { bulanTertutup, penghalang } from "./tutupBuku";
import type { TutupBuku } from "./types";

const tb = (periode: string, status: TutupBuku["status"]): TutupBuku => ({
  id: periode, periode, status, ditutup_oleh: "u1", ditutup_pada: "2026-10-05T01:00:00Z", dibuka_oleh: null, dibuka_pada: null, alasan_buka: null, laba_bersih: "0",
});

describe("tutup buku", () => {
  it("penghalang: hanya butir penghalang yang belum siap", () => {
    const butir = [
      { kode: "draf", label: "Draf", siap: false, penghalang: true, keterangan: "" },
      { kode: "cek_fisik", label: "Cek fisik", siap: false, penghalang: false, keterangan: "" },
      { kode: "gaji", label: "Gaji", siap: true, penghalang: true, keterangan: "" },
    ];
    expect(penghalang({ butir }).map((b) => b.kode)).toEqual(["draf"]);
    expect(penghalang(undefined)).toEqual([]);
  });
  it("bulanTertutup: hanya status ditutup, terbaru dulu", () => {
    expect(bulanTertutup([tb("2026-08", "ditutup"), tb("2026-10", "dibuka"), tb("2026-09", "ditutup")])).toEqual(["2026-09", "2026-08"]);
  });
});
