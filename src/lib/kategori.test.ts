import { describe, expect, it } from "vitest";
import { isKategoriSistem, kategoriKasKecil, kategoriManual, labelKategori, pilihanKategori } from "./kategori";
import type { Kategori } from "./types";

/** Sama dengan DEFAULT_KATEGORI di seeder backend. */
const SEED: [string, Kategori["jenis"]][] = [
  ["Penjualan marketplace", "pemasukan"],
  ["Penjualan toko web", "pemasukan"],
  ["Penjualan reseller", "pemasukan"],
  ["Pemasukan lain", "pemasukan"],
  ["Biaya produksi / pembelian barang", "pengeluaran"],
  ["Gaji karyawan", "pengeluaran"],
  ["Bagi hasil", "pengeluaran"],
  ["Transport", "pengeluaran"],
  ["Packing", "pengeluaran"],
  ["Operasional", "pengeluaran"],
  ["Biaya iklan", "pengeluaran"],
  ["Langganan & utilitas", "pengeluaran"],
  ["Prive", "pengeluaran"],
  ["Pengeluaran lain", "pengeluaran"],
];
const kategori: Kategori[] = SEED.map(([nama, jenis], i) => ({ id: `k${i}`, nama, jenis }));
const nama = (ks: Kategori[]) => ks.map((k) => k.nama);

describe("kategori", () => {
  it("kas kecil / staf hanya 4 kategori, berurutan", () => {
    expect(nama(kategoriKasKecil(kategori))).toEqual(["Transport", "Packing", "Operasional", "Pengeluaran lain"]);
  });

  it("kas kecil tetap jalan bila sebagian kategori belum ada dan cocok tanpa peduli huruf besar", () => {
    const sebagian: Kategori[] = [
      { id: "a", nama: "packing", jenis: "pengeluaran" },
      { id: "b", nama: "Transport ", jenis: "pengeluaran" },
      { id: "c", nama: "Transport", jenis: "pemasukan" },
    ];
    expect(kategoriKasKecil(sebagian).map((k) => k.id)).toEqual(["b", "a"]);
  });

  it("form manual menyembunyikan kategori sistem", () => {
    const keluar = nama(kategoriManual(kategori, "keluar"));
    for (const s of ["Bagi hasil", "Gaji karyawan", "Biaya produksi / pembelian barang", "Langganan & utilitas"]) expect(keluar).not.toContain(s);
    expect(keluar).toEqual(["Transport", "Packing", "Operasional", "Biaya iklan", "Prive", "Pengeluaran lain"]);
    const masuk = nama(kategoriManual(kategori, "masuk"));
    expect(masuk).not.toContain("Penjualan reseller");
    // Penjualan marketplace masih manual sampai unggah pencairan (Fase 2) tersedia.
    expect(masuk).toEqual(["Penjualan marketplace", "Penjualan toko web", "Pemasukan lain"]);
  });

  it("pilihanKategori: staf dan pengeluaran akun kas kecil memakai 4 kategori", () => {
    expect(nama(pilihanKategori(kategori, { jenis: "keluar", staf: true }))).toHaveLength(4);
    expect(nama(pilihanKategori(kategori, { jenis: "keluar", akun: { jenis: "kas_kecil" } }))).toHaveLength(4);
    expect(nama(pilihanKategori(kategori, { jenis: "keluar", akun: { jenis: "kas" } }))).toContain("Prive");
    expect(nama(pilihanKategori(kategori, { jenis: "masuk", akun: { jenis: "kas_kecil" } }))).toContain("Pemasukan lain");
  });

  it("isKategoriSistem dan label tampil", () => {
    expect(isKategoriSistem({ nama: "gaji karyawan" })).toBe(true);
    expect(isKategoriSistem({ nama: "Transport" })).toBe(false);
    expect(labelKategori("Pengeluaran lain")).toBe("Lainnya");
    expect(labelKategori("Penjualan reseller")).toBe("Penjualan penjual lain");
    expect(labelKategori("Langganan & utilitas")).toBe("Tagihan rutin");
    expect(labelKategori("Transport")).toBe("Transport");
    expect(labelKategori(undefined)).toBe("—");
  });
});
