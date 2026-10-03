import { useQuery } from "@tanstack/react-query";
import { api, query } from "./api";
import type { FormatPenghasilan, KelompokPencairan, KolomTujuan, PencairanUnggahan } from "./types";

export const LABEL_KELOMPOK: Record<KelompokPencairan, string> = {
  cocok: "Cocok",
  selisih: "Cocok dengan selisih",
  tidak_cocok: "Tidak ditemukan",
  duplikat: "Sudah pernah dicatat",
  penyesuaian: "Penyesuaian",
};

export const WARNA_KELOMPOK = { cocok: "hijau", selisih: "oranye", tidak_cocok: "merah", duplikat: "abu", penyesuaian: "oranye" } as const;

export const URUTAN_KELOMPOK: KelompokPencairan[] = ["cocok", "selisih", "tidak_cocok", "duplikat", "penyesuaian"];

export const LABEL_KOLOM: Record<KolomTujuan, string> = {
  kode_pesanan: "Kode pesanan",
  tanggal_cair: "Tanggal cair",
  harga_jual: "Harga jual",
  potongan_biaya: "Potongan / biaya",
  jumlah_cair: "Jumlah cair",
};

export const WAJIB_KOLOM: KolomTujuan[] = ["kode_pesanan", "tanggal_cair", "jumlah_cair"];

export const usePencairan = (saluranId?: string) =>
  useQuery({ queryKey: ["pencairan", saluranId ?? ""], queryFn: () => api<PencairanUnggahan[]>(`/pencairan${query({ saluran_id: saluranId })}`) });

export const useFormatPenghasilan = (saluranId?: string, aktif = true) =>
  useQuery({
    queryKey: ["format-penghasilan", saluranId ?? ""],
    queryFn: () => api<FormatPenghasilan[]>(`/format-penghasilan${query({ saluran_id: saluranId })}`),
    enabled: aktif,
  });

export function formulir(isi: Record<string, string | Blob | null | undefined>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(isi)) if (v !== null && v !== undefined && v !== "") f.append(k, v);
  return f;
}
