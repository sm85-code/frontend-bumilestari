import { num } from "./format";
import type { AkunKas, Invoice, PengisianImprest, SiapBayar, Sisihan, Transfer } from "./types";

/** Selasa terakhir pada atau sebelum `iso` (sama dengan `selasa_acuan` di backend). */
export function selasaAcuan(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const mundur = (t.getUTCDay() - 2 + 7) % 7; // Minggu=0, Selasa=2
  t.setUTCDate(t.getUTCDate() - mundur);
  return t.toISOString().slice(0, 10);
}

/** Tambah hari pada tanggal ISO. */
export function tambahHari(iso: string, hari: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + hari));
  return t.toISOString().slice(0, 10);
}

export type IdLangkah = "terima" | "pencairan" | "tarik" | "bayar_tukang" | "talangan" | "sisihan" | "isi_kas";
export type StatusLangkah = "selesai" | "belum" | "dilewati";

export interface Langkah {
  id: IdLangkah;
  judul: string;
  bagian: "Uang masuk" | "Uang keluar";
  /** Backend belum ada: tampil "segera hadir" dan tidak bisa dikerjakan (tidak memalsukan data). */
  segera?: string;
}

/** Urutan langkah sesuai spesifikasi 7.4. Langkah 2 dan 5 menunggu backend Fase 1/2. */
export const LANGKAH: Langkah[] = [
  { id: "terima", judul: "Terima bayar penjual lain", bagian: "Uang masuk" },
  {
    id: "pencairan",
    judul: "Catat pencairan marketplace & iPaymu",
    bagian: "Uang masuk",
    segera: "Pemasukan marketplace & iPaymu akan masuk dari impor file pencairan (segera hadir).",
  },
  { id: "tarik", judul: "Tarik saldo ke Kas utama", bagian: "Uang masuk" },
  { id: "bayar_tukang", judul: "Bayar tukang & supplier", bagian: "Uang keluar" },
  { id: "talangan", judul: "Lunasi talangan", bagian: "Uang keluar", segera: "Pencatatan talangan belum tersedia." },
  { id: "sisihan", judul: "Sisihkan dana gaji", bagian: "Uang keluar" },
  { id: "isi_kas", judul: "Isi kas kecil & kas iklan sampai plafon", bagian: "Uang keluar" },
];

export const LANGKAH_AKTIF = LANGKAH.filter((l) => !l.segera);

export interface DataSelasa {
  selasa: string;
  akun?: AkunKas[];
  invoice?: Invoice[];
  transfer?: Transfer[];
  siap?: SiapBayar;
  sisihan?: Sisihan;
  isiKasKecil?: PengisianImprest;
  /** undefined bila pengguna bukan admin (kas iklan khusus admin). */
  isiKasIklan?: PengisianImprest;
}

const dalamMinggu = (tgl: string, selasa: string) => tgl >= selasa && tgl <= tambahHari(selasa, 6);

/** Akun saldo toko yang ditarik ke Kas utama (e-wallet/bank selain Kas utama). */
export function akunSaldoToko(akun: AkunKas[] | undefined): AkunKas[] {
  return (akun ?? []).filter((a) => a.kode !== "KAS_UTAMA" && (a.jenis === "ewallet" || a.jenis === "bank"));
}

/** Imprest sudah beres: diisi minggu ini, sudah penuh, atau plafon 0 (akun tidak dipakai). */
function imprestBeres(info: PengisianImprest | undefined, transfer: Transfer[], jenis: string, selasa: string): boolean | undefined {
  if (!info) return undefined;
  if (num(info.plafon) <= 0 || num(info.perlu_diisi) <= 0) return true;
  return transfer.some((t) => !t.dibatalkan && t.jenis === jenis && dalamMinggu(t.tanggal, selasa));
}

/**
 * Langkah yang bisa dipastikan selesai dari data endpoint yang ada. true = selesai, false = belum,
 * undefined = data belum dimuat. Tanda manual (selesai/dilewati) disimpan terpisah di localStorage.
 */
export function selesaiOtomatis(d: DataSelasa): Partial<Record<IdLangkah, boolean>> {
  const transfer = d.transfer ?? [];
  const hasil: Partial<Record<IdLangkah, boolean>> = {};
  if (d.invoice) hasil.terima = d.invoice.length === 0;
  if (d.akun && d.transfer) {
    const toko = akunSaldoToko(d.akun);
    const kasUtama = d.akun.find((a) => a.kode === "KAS_UTAMA");
    const idToko = new Set(toko.map((a) => a.id));
    const sudahTarik = transfer.some((t) => !t.dibatalkan && idToko.has(t.dari_akun_id) && t.ke_akun_id === kasUtama?.id && dalamMinggu(t.tanggal, d.selasa));
    hasil.tarik = sudahTarik || toko.every((a) => num(a.saldo) <= 0);
  }
  if (d.siap) hasil.bayar_tukang = Boolean(d.siap.sudah_dicatat_id) || d.siap.pemasok.length === 0;
  if (d.sisihan) hasil.sisihan = Boolean(d.sisihan.sudah_dicatat_id) || d.sisihan.items.length === 0;
  const kecil = imprestBeres(d.isiKasKecil, transfer, "pengisian_kas_kecil", d.selasa);
  const iklan = d.isiKasIklan ? imprestBeres(d.isiKasIklan, transfer, "pengisian_kas_iklan", d.selasa) : true;
  if (kecil !== undefined && iklan !== undefined) hasil.isi_kas = kecil && iklan;
  return hasil;
}

export type TandaManual = Partial<Record<IdLangkah, Exclude<StatusLangkah, "belum">>>;

export function statusLangkah(id: IdLangkah, otomatis: Partial<Record<IdLangkah, boolean>>, tanda: TandaManual): StatusLangkah {
  if (otomatis[id]) return "selesai";
  return tanda[id] ?? "belum";
}

/* ---------- Tanda manual per Selasa (sementara di localStorage; Fase 2: tabel bl_selasa_langkah) ---------- */
const kunci = (selasa: string) => `bl-selasa-langkah:${selasa}`;

export function bacaTanda(selasa: string): TandaManual {
  try {
    return JSON.parse(window.localStorage.getItem(kunci(selasa)) ?? "{}") as TandaManual;
  } catch {
    return {};
  }
}

export function simpanTanda(selasa: string, id: IdLangkah, status: Exclude<StatusLangkah, "belum"> | null): TandaManual {
  const t = { ...bacaTanda(selasa) };
  if (status) t[id] = status;
  else delete t[id];
  try {
    window.localStorage.setItem(kunci(selasa), JSON.stringify(t));
  } catch {
    /* localStorage diblokir: tanda hanya berlaku sampai halaman ditutup */
  }
  return t;
}
