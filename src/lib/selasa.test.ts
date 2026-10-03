import { describe, expect, it } from "vitest";
import { LANGKAH, LANGKAH_AKTIF, selasaAcuan, selesaiOtomatis, statusLangkah, tambahHari } from "./selasa";
import type { AkunKas, PengisianImprest, Transfer } from "./types";

const akun: AkunKas[] = [
  { id: "a1", kode: "KAS_UTAMA", nama: "Kas utama", jenis: "kas", plafon: null, saldo: "1000" },
  { id: "a2", kode: "SALDO_SHOPEE", nama: "Saldo Shopee", jenis: "ewallet", plafon: null, saldo: "500" },
];
const trf = (x: Partial<Transfer>): Transfer => ({
  id: "t", tanggal: "2026-09-29", dari_akun_id: "a2", ke_akun_id: "a1", jumlah: "500", jenis: "biasa", keterangan: "", dibatalkan: false, alasan_batal: null, ...x,
});
const isi = (perlu: string, plafon = "3000000"): PengisianImprest => ({ akun_id: "k", plafon, saldo: "0", perlu_diisi: perlu, saldo_kas_utama: "0", cukup: true });

describe("selasa", () => {
  it("selasaAcuan = Selasa terakhir pada/sebelum tanggal", () => {
    expect(selasaAcuan("2026-09-29")).toBe("2026-09-29"); // Selasa
    expect(selasaAcuan("2026-10-04")).toBe("2026-09-29"); // Minggu
    expect(selasaAcuan("2026-09-28")).toBe("2026-09-22"); // Senin
    expect(selasaAcuan("2026-10-01")).toBe("2026-09-29"); // Kamis
    expect(tambahHari("2026-09-29", 6)).toBe("2026-10-05");
  });

  it("urutan langkah sesuai spesifikasi; langkah tanpa backend ditandai segera hadir", () => {
    expect(LANGKAH.map((l) => l.id)).toEqual(["terima", "pencairan", "tarik", "bayar_tukang", "talangan", "sisihan", "isi_kas", "kirim"]);
    expect(LANGKAH_AKTIF.map((l) => l.id)).toEqual(["terima", "tarik", "bayar_tukang", "sisihan", "isi_kas", "kirim"]);
  });

  it("status otomatis dari data endpoint", () => {
    const s = "2026-09-29";
    expect(selesaiOtomatis({ selasa: s })).toEqual({});
    expect(selesaiOtomatis({ selasa: s, invoice: [] }).terima).toBe(true);
    expect(selesaiOtomatis({ selasa: s, akun, transfer: [] }).tarik).toBe(false);
    expect(selesaiOtomatis({ selasa: s, akun, transfer: [trf({})] }).tarik).toBe(true);
    expect(selesaiOtomatis({ selasa: s, akun, transfer: [trf({ dibatalkan: true })] }).tarik).toBe(false);
    expect(selesaiOtomatis({ selasa: s, akun, transfer: [trf({ tanggal: "2026-09-28" })] }).tarik).toBe(false); // minggu lalu
    expect(selesaiOtomatis({ selasa: s, akun: [akun[0], { ...akun[1], saldo: "0" }], transfer: [] }).tarik).toBe(true);
    expect(selesaiOtomatis({ selasa: s, siap: { selasa: s, batas_diambil: "2026-09-26", sudah_dicatat_id: null, total: "0", pemasok: [] } }).bayar_tukang).toBe(true);
    // Sudah ada pembayaran tapi masih ada tukang yang belum dibayar: belum selesai (boleh beberapa pembayaran per minggu).
    const sisa = [{ pemasok_id: "p1", nama: "Pak Ade", jenis: "tukang", subtotal: "100000", items: [] }];
    expect(selesaiOtomatis({ selasa: s, siap: { selasa: s, batas_diambil: "2026-09-26", sudah_dicatat_id: "pb1", total: "100000", pemasok: sisa } }).bayar_tukang).toBe(false);
    const draf = (n: number) => [{ sumber: "kas_kecil" as const, label: "Kas kecil", jumlah_entri: n, total_masuk: "0", total_keluar: "0", total: "0", tanggal_tertua: null, entri: [] }];
    expect(selesaiOtomatis({ selasa: s, draf: draf(2) }).kirim).toBe(false);
    expect(selesaiOtomatis({ selasa: s, draf: draf(0) }).kirim).toBe(true);
    expect(selesaiOtomatis({ selasa: s }).kirim).toBeUndefined();
    expect(selesaiOtomatis({ selasa: s, transfer: [], isiKasKecil: isi("150000") }).isi_kas).toBe(false);
    expect(selesaiOtomatis({ selasa: s, transfer: [trf({ jenis: "pengisian_kas_kecil", dari_akun_id: "a1", ke_akun_id: "k" })], isiKasKecil: isi("50000") }).isi_kas).toBe(true);
    expect(selesaiOtomatis({ selasa: s, transfer: [], isiKasKecil: isi("0"), isiKasIklan: isi("400000", "2000000") }).isi_kas).toBe(false);
    expect(selesaiOtomatis({ selasa: s, transfer: [], isiKasKecil: isi("0"), isiKasIklan: isi("0", "0") }).isi_kas).toBe(true);
  });

  it("tanda manual hanya dipakai bila belum selesai otomatis", () => {
    expect(statusLangkah("tarik", { tarik: true }, { tarik: "dilewati" })).toBe("selesai");
    expect(statusLangkah("tarik", { tarik: false }, { tarik: "dilewati" })).toBe("dilewati");
    expect(statusLangkah("tarik", {}, {})).toBe("belum");
  });
});
