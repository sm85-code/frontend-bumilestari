import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Memuat } from "./ui";
import { api } from "../lib/api";
import { rp, tanggal } from "../lib/format";
import type { Kategori, Transaksi } from "../lib/types";

export default function DaftarTransaksi({
  data,
  kategori,
  bolehBatal,
  memuat,
}: {
  data: Transaksi[] | undefined;
  kategori: Kategori[];
  bolehBatal: boolean;
  memuat?: boolean;
}) {
  const qc = useQueryClient();
  const nama = new Map(kategori.map((k) => [k.id, k.nama]));
  const batal = useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) => api(`/transaksi/${id}/batal`, { body: { alasan } }),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => window.alert(e instanceof Error ? e.message : "Gagal membatalkan"),
  });

  if (memuat) return <Memuat />;
  if (!data || data.length === 0) return <p className="py-4 text-center text-sm text-stone-500">Belum ada transaksi.</p>;
  return (
    <ul className="divide-y divide-garis">
      {data.map((t) => (
        <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{nama.get(t.kategori_id) ?? "—"}</p>
            <p className="truncate text-xs text-stone-500">
              {tanggal(t.tanggal)}
              {t.keterangan ? ` · ${t.keterangan}` : ""}
            </p>
            {bolehBatal && (
              <button
                className="mt-1 text-xs text-red-600"
                onClick={() => {
                  const alasan = window.prompt("Alasan membatalkan transaksi ini?");
                  if (alasan && alasan.trim().length >= 3) batal.mutate({ id: t.id, alasan: alasan.trim() });
                }}
              >
                Batalkan
              </button>
            )}
          </div>
          <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.jenis === "masuk" ? "text-hijau" : "text-stone-800"}`}>
            {t.jenis === "masuk" ? "+" : "−"}
            {rp(t.jumlah)}
          </span>
        </li>
      ))}
    </ul>
  );
}
