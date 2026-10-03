import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Kosong, Memuat, Tabel, Td, Th } from "./ui";
import { api } from "../lib/api";
import { rp, tanggal } from "../lib/format";
import type { Kategori, Transaksi } from "../lib/types";

/** Riwayat transaksi sebagai tabel (digulir ke samping di layar sempit). */
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
  if (!data || data.length === 0) return <Kosong teks="Belum ada transaksi." />;
  return (
    <Tabel minLebar={bolehBatal ? 560 : 460}>
      <thead>
        <tr>
          <Th lengket>Tanggal</Th>
          <Th>Kategori</Th>
          <Th>Keterangan</Th>
          <Th kanan>Jumlah</Th>
          {bolehBatal && <Th>Aksi</Th>}
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id}>
            <Td lengket className="whitespace-nowrap">{tanggal(t.tanggal)}</Td>
            <Td>{nama.get(t.kategori_id) ?? "—"}</Td>
            <Td className="text-stone-600">{t.keterangan || "—"}</Td>
            <Td kanan className={t.jenis === "masuk" ? "text-hijau" : ""}>
              {t.jenis === "masuk" ? "+" : "−"}
              {rp(t.jumlah)}
            </Td>
            {bolehBatal && (
              <Td>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => {
                    const alasan = window.prompt("Alasan membatalkan transaksi ini?");
                    if (alasan && alasan.trim().length >= 3) batal.mutate({ id: t.id, alasan: alasan.trim() });
                  }}
                >
                  Batalkan
                </button>
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </Tabel>
  );
}
