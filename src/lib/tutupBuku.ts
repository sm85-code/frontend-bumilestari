import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { KesiapanTutupBuku, TutupBuku } from "./types";

/**
 * Tutup buku bulanan (spesifikasi 8.10): daftar kesiapan, kunci bulan + snapshot, buka darurat. Setelah ditutup,
 * backend menolak semua catatan/pembatalan bertanggal di bulan itu; koreksi dicatat di bulan berjalan.
 */

/** Butir penghalang yang belum siap (yang harus diselesaikan dulu). */
export function penghalang(k: Pick<KesiapanTutupBuku, "butir"> | undefined) {
  return (k?.butir ?? []).filter((b) => b.penghalang && !b.siap);
}

/** Bulan yang sedang ditutup (boleh dipakai sebagai `koreksi_periode`), terbaru dulu. */
export function bulanTertutup(daftar: readonly TutupBuku[] | undefined): string[] {
  return (daftar ?? [])
    .filter((t) => t.status === "ditutup")
    .map((t) => t.periode)
    .sort()
    .reverse();
}

export const useDaftarTutupBuku = (aktif = true) => useQuery({ queryKey: ["tutup-buku"], enabled: aktif, queryFn: () => api<TutupBuku[]>("/tutup-buku") });

export const useKesiapan = (periode: string) =>
  useQuery({ queryKey: ["tutup-buku", periode, "kesiapan"], queryFn: () => api<KesiapanTutupBuku>(`/tutup-buku/${periode}/kesiapan`) });
