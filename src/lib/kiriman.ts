import { useQuery } from "@tanstack/react-query";
import { api, query } from "./api";
import { num, rp, tanggal } from "./format";
import type { DrafSumber, Kiriman, SumberKiriman } from "./types";

/**
 * "Kirim ke laporan keuangan" (spesifikasi 1.13, AB-KR): catatan kas kecil, kas iklan, penerimaan penjual lain dan
 * pembayaran tukang & supplier tersimpan sebagai DRAF dulu. Laporan, saldo resmi dan laba hanya membaca catatan yang
 * sudah dikirim. Setelah dikirim catatan terkunci; koreksi dengan membatalkan kirimannya (beralasan).
 */
export const LABEL_SUMBER: Record<SumberKiriman, string> = {
  kas_kecil: "Kas kecil",
  kas_iklan: "Kas iklan",
  penerimaan_reseller: "Penerimaan penjual lain",
  pembayaran_pemasok: "Pembayaran tukang & supplier",
};

/** Sumber yang boleh dikirim pengguna: kas iklan khusus admin (sama dengan backend). */
export function sumberUntuk(admin: boolean): SumberKiriman[] {
  return (Object.keys(LABEL_SUMBER) as SumberKiriman[]).filter((s) => admin || s !== "kas_iklan");
}

export interface RingkasanDraf {
  jumlah: number;
  total: number;
  tertua: string | null;
}

/** Jumlah entri, total nilai, dan tanggal tertua dari satu atau beberapa sumber draf. */
export function ringkasDraf(draf: readonly DrafSumber[] | undefined): RingkasanDraf {
  let jumlah = 0;
  let total = 0;
  let tertua: string | null = null;
  for (const d of draf ?? []) {
    jumlah += d.jumlah_entri;
    total += num(d.total);
    if (d.tanggal_tertua && (!tertua || d.tanggal_tertua < tertua)) tertua = d.tanggal_tertua;
  }
  return { jumlah, total, tertua };
}

/** Kalimat ringkas untuk dialog konfirmasi / kartu. */
export function teksDraf(r: RingkasanDraf): string {
  if (r.jumlah === 0) return "Tidak ada catatan draf.";
  return `${r.jumlah} catatan draf senilai ${rp(r.total)}${r.tertua ? `, paling lama ${tanggal(r.tertua)}` : ""}`;
}

/** Waktu kirim/batal (ISO ber-zona dari server) dalam waktu lokal. */
export function waktu(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Draf yang belum dikirim (owner/admin). `sumber` kosong = semua sumber yang boleh. */
export const useDraf = (sumber?: SumberKiriman, aktif = true) =>
  useQuery({ queryKey: ["kiriman-draf", sumber ?? "semua"], enabled: aktif, queryFn: () => api<DrafSumber[]>(`/kiriman/draf${query({ sumber })}`) });

export const useRiwayatKiriman = (sumber?: SumberKiriman, aktif = true) =>
  useQuery({ queryKey: ["kiriman", sumber ?? "semua"], enabled: aktif, queryFn: () => api<Kiriman[]>(`/kiriman${query({ sumber })}`) });
