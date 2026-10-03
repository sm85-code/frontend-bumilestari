import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { AkunKas, Kategori, Pelanggan, Pemasok, Produk, Saluran } from "./types";

export const useProduk = () => useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/produk") });
export const usePemasok = () => useQuery({ queryKey: ["pemasok"], queryFn: () => api<Pemasok[]>("/pemasok") });
export const useSaluran = () => useQuery({ queryKey: ["saluran"], queryFn: () => api<Saluran[]>("/saluran") });
export const usePelanggan = () => useQuery({ queryKey: ["pelanggan"], queryFn: () => api<Pelanggan[]>("/pelanggan") });
export const useAkun = () => useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
export const useKategori = () => useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });

/** Pemetaan id -> objek, untuk menampilkan nama di tabel. */
export function peta<T extends { id: string }>(data: T[] | undefined): Map<string, T> {
  return new Map((data ?? []).map((x) => [x.id, x]));
}

/**
 * Aksi tulis ke backend. Setelah berhasil semua data di-refresh (aplikasi kecil, lebih aman daripada
 * menebak query mana yang terdampak).
 */
export function useAksi<T = unknown>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method, body }: { path: string; method?: string; body?: unknown }) =>
      api<T>(path, { method: method ?? "POST", body: body ?? {} }),
    onSuccess: () => void qc.invalidateQueries(),
  });
}
