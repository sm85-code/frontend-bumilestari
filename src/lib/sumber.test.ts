import { describe, expect, it } from "vitest";
import { sumberTransaksi, sumberTransfer } from "./sumber";

describe("sumber transaksi otomatis", () => {
  it("transaksi manual tidak punya sumber", () => {
    expect(sumberTransaksi({ ref_jenis: null })).toBeNull();
    expect(sumberTransaksi({})).toBeNull();
  });
  it("transaksi otomatis menunjuk halaman asal", () => {
    expect(sumberTransaksi({ ref_jenis: "pembayaran_pemasok" })).toEqual({ label: "Bayar tukang & supplier", ke: "/pesanan-tukang" });
    expect(sumberTransaksi({ ref_jenis: "penerimaan_reseller" })?.ke).toBe("/penjual-lain");
    expect(sumberTransaksi({ ref_jenis: "tagihan" })?.ke).toBe("/gaji");
    expect(sumberTransaksi({ ref_jenis: "jenis_baru" })).toEqual({ label: "halaman asalnya", ke: "" });
  });
  it("hanya transfer sisihan yang terkunci", () => {
    expect(sumberTransfer({ jenis: "sisihan_dana" })?.ke).toBe("/selasa");
    expect(sumberTransfer({ jenis: "biasa" })).toBeNull();
    expect(sumberTransfer({ jenis: "pengisian_kas_kecil" })).toBeNull();
  });
});
