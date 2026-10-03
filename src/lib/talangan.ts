import { useQuery } from "@tanstack/react-query";
import { api, query } from "./api";
import { num } from "./format";
import type { AkunKas, Talangan } from "./types";

/** Talangan belum lunas (bawaan) atau semua (riwayat, termasuk dibatalkan). */
export const useTalangan = (aktif = true, status: "belum_lunas" | "semua" = "belum_lunas") =>
  useQuery({ queryKey: ["talangan", status], enabled: aktif, queryFn: () => api<Talangan[]>(`/talangan${query({ status })}`) });

export const useNamaTalangan = (aktif = true) => useQuery({ queryKey: ["talangan-nama"], enabled: aktif, queryFn: () => api<string[]>("/talangan/nama") });

/** Kekurangan saldo kas kecil/kas iklan untuk pengeluaran `jumlah` (0 bila cukup / bukan akun imprest). Memakai uang fisik (setelah draf). */
export function kekuranganSaldo(akun: AkunKas | undefined, jenis: string, jumlah: number): number {
  if (!akun || jenis !== "keluar" || (akun.jenis !== "kas_kecil" && akun.jenis !== "kas_iklan")) return 0;
  const saldo = Math.max(0, num(akun.saldo_setelah_draf ?? akun.saldo));
  return jumlah > saldo ? jumlah - saldo : 0;
}

/** Kelompokkan per orang: [nama, total sisa, daftar]. */
export function perOrang(daftar: Talangan[]): [string, number, Talangan[]][] {
  const m = new Map<string, Talangan[]>();
  for (const t of daftar) m.set(t.nama, [...(m.get(t.nama) ?? []), t]);
  return [...m.entries()].map(([nama, l]) => [nama, l.reduce((a, t) => a + num(t.sisa), 0), l] as [string, number, Talangan[]]).sort((a, b) => b[1] - a[1]);
}
