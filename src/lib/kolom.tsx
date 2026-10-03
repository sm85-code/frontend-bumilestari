import { useQuery } from "@tanstack/react-query";
import type { TableColumnsType } from "antd";
import { api, query } from "./api";
import { rp, tanggal } from "./format";
import type { DefinisiKolom, EntitasKolom, NilaiKolom, TipeKolom } from "./types";

export const LABEL_ENTITAS: Record<EntitasKolom, string> = {
  order: "Order",
  produk: "Produk",
  pemasok: "Tukang & supplier",
  pelanggan: "Penjual lain",
  transaksi: "Transaksi",
  karyawan: "Karyawan",
};
export const LABEL_TIPE: Record<TipeKolom, string> = {
  teks: "Teks",
  angka: "Angka",
  mata_uang: "Mata uang",
  tanggal: "Tanggal",
  pilihan: "Pilihan",
  ya_tidak: "Ya/Tidak",
};

export function useDefinisiKolom(entitas: EntitasKolom, aktif = true) {
  return useQuery({
    queryKey: ["definisi-kolom", entitas],
    queryFn: () => api<DefinisiKolom[]>(`/definisi-kolom${query({ entitas })}`),
    select: (d: DefinisiKolom[]) => d.filter((x) => x.entitas === entitas),
    enabled: aktif,
    staleTime: 60_000,
  });
}

/** Kolom tambahan aktif yang tampil di form (urut). */
export const kolomForm = (defs: DefinisiKolom[] | undefined) =>
  (defs ?? []).filter((d) => d.lapisan === "tambahan" && d.aktif && d.tampil_form).sort((a, b) => a.urutan - b.urutan);

export function tampilNilai(d: Pick<DefinisiKolom, "tipe">, v: NilaiKolom | undefined | null): string {
  if (v === undefined || v === null || v === "") return "—";
  if (d.tipe === "ya_tidak") return v === true ? "Ya" : "Tidak";
  if (d.tipe === "mata_uang") return rp(String(v));
  if (d.tipe === "tanggal") return tanggal(String(v));
  return String(v);
}

/** Kolom tabel untuk kolom tambahan bertanda "tampil di tabel" (owner tidak menerima kolom tambahan). */
export function kolomTabelTambahan<T extends { kolom_tambahan?: Record<string, NilaiKolom> }>(defs: DefinisiKolom[] | undefined): TableColumnsType<T> {
  return (defs ?? [])
    .filter((d) => d.lapisan === "tambahan" && d.aktif && d.tampil_tabel)
    .sort((a, b) => a.urutan - b.urutan)
    .map((d) => ({ title: d.label, key: `kt.${d.kunci}`, render: (_: unknown, r: T) => tampilNilai(d, r.kolom_tambahan?.[d.kunci]) }));
}
