import { bulanTahun, num, rp, tanggal } from "./format";
import { saldoRendah } from "./kas";
import type { Imprest } from "./types";

export interface Tugas {
  id: string;
  teks: string;
  ke: string;
  penting?: boolean;
  /** Tugas tanpa data backend (cek fisik) ditandai selesai manual per bulan di localStorage. */
  manual?: boolean;
}

export interface InputTugas {
  hariIni: string;
  selasa: string;
  selasaBeres: number;
  selasaTotal: number;
  /** Utang tukang & supplier siap bayar dan belum dicatat Selasa ini. */
  utangTukang: number;
  tukangSudahDibayar: boolean;
  tagihanPenjualLain: number;
  jumlahInvoice: number;
  kasKecil?: Imprest | null;
  kasIklan?: Imprest | null;
  /** Periode bulan lalu (YYYY-MM). */
  periodeLalu: string;
  /** undefined = data belum dimuat / tidak relevan. */
  gajiBelumDibayar?: boolean;
  tagihanRutinBelum?: number;
  cekFisikSelesai: boolean;
}

/** Awal bulan = tanggal 1–10: waktunya bayar gaji, tagihan rutin, dan cek fisik kas kecil bulan lalu. */
export const awalBulan = (iso: string) => Number(iso.slice(8, 10)) <= 10;

export function periodeSebelum(iso: string): string {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Daftar "Yang perlu dikerjakan" di Beranda owner/admin, hanya dari data endpoint yang sudah ada. */
export function daftarTugas(i: InputTugas): Tugas[] {
  const t: Tugas[] = [];
  if (i.selasaBeres < i.selasaTotal) {
    t.push({ id: "selasa", teks: `Tutup Kas Mingguan (Selasa ${tanggal(i.selasa)}): ${i.selasaBeres} dari ${i.selasaTotal} langkah beres`, ke: "/selasa", penting: true });
  }
  if (i.utangTukang > 0 && !i.tukangSudahDibayar) t.push({ id: "tukang", teks: `Bayar tukang & supplier ${rp(i.utangTukang)}`, ke: "/selasa" });
  if (i.tagihanPenjualLain > 0) t.push({ id: "penjual-lain", teks: `Terima bayar ${i.jumlahInvoice} penjual lain: ${rp(i.tagihanPenjualLain)} jatuh tempo Selasa ini`, ke: "/selasa" });
  for (const [id, label, d, ke] of [
    ["kas-kecil", "Kas kecil", i.kasKecil, "/kas-kecil"],
    ["kas-iklan", "Kas iklan", i.kasIklan, "/selasa"],
  ] as const) {
    if (d && saldoRendah(num(d.saldo), num(d.plafon))) t.push({ id, teks: `Saldo ${label} tinggal ${rp(d.saldo)} (di bawah 20% plafon ${rp(d.plafon)})`, ke, penting: true });
  }
  if (awalBulan(i.hariIni)) {
    const bln = bulanTahun(i.periodeLalu);
    if (i.gajiBelumDibayar) t.push({ id: "gaji", teks: `Bayar gaji ${bln} dari Dana cadangan`, ke: "/gaji" });
    if (i.tagihanRutinBelum) t.push({ id: "tagihan", teks: `Bayar ${i.tagihanRutinBelum} tagihan rutin ${bln}`, ke: "/gaji" });
    if (!i.cekFisikSelesai) t.push({ id: "cek-fisik", teks: `Cek fisik kas kecil ${bln} (hitung uang di laci)`, ke: "/laporan/kas-kecil", manual: true });
  }
  return t;
}
