import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import type { TableColumnsType } from "antd";
import { DataTabel, Memuat } from "./ui";
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

  const kolom: TableColumnsType<Transaksi> = [
    { title: "Tanggal", dataIndex: "tanggal", width: 110, fixed: "left", render: (v: string) => <span className="whitespace-nowrap">{tanggal(v)}</span> },
    { title: "Kategori", dataIndex: "kategori_id", width: 160, render: (v: string) => nama.get(v) ?? "—" },
    { title: "Keterangan", dataIndex: "keterangan", render: (v: string) => <span className="text-coklat">{v || "—"}</span> },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      align: "right",
      width: 150,
      render: (_, t) => (
        <b className={`tabular-nums whitespace-nowrap ${t.jenis === "masuk" ? "text-hijau" : ""}`}>
          {t.jenis === "masuk" ? "+" : "−"}
          {rp(t.jumlah)}
        </b>
      ),
    },
  ];
  if (bolehBatal)
    kolom.push({
      title: "Aksi",
      width: 100,
      render: (_, t) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => {
            const alasan = window.prompt("Alasan membatalkan transaksi ini?");
            if (alasan && alasan.trim().length >= 3) batal.mutate({ id: t.id, alasan: alasan.trim() });
          }}
        >
          Batalkan
        </Button>
      ),
    });

  return <DataTabel kolom={kolom} data={data ?? []} rowKey="id" minLebar={bolehBatal ? 620 : 520} kosong="Belum ada transaksi." />;
}
