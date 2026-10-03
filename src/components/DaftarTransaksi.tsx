import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType } from "antd";
import { Angka, DataTabel, Memuat, TombolLink, useDialog } from "./ui";
import { Typography } from "antd";
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
  const { tanya, message } = useDialog();
  const nama = new Map(kategori.map((k) => [k.id, k.nama]));
  const batal = useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) => api(`/transaksi/${id}/batal`, { body: { alasan } }),
    onSuccess: () => void qc.invalidateQueries(),
    onError: (e) => message.error(e instanceof Error ? e.message : "Gagal membatalkan"),
  });

  if (memuat) return <Memuat />;

  const kolom: TableColumnsType<Transaksi> = [
    { title: "Tanggal", dataIndex: "tanggal", width: 110, fixed: "left", render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Kategori", dataIndex: "kategori_id", width: 160, render: (v: string) => nama.get(v) ?? "—" },
    { title: "Keterangan", dataIndex: "keterangan", render: (v: string) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
    {
      title: "Jumlah",
      dataIndex: "jumlah",
      align: "right",
      width: 150,
      render: (_, t) => (
        <Typography.Text strong type={t.jenis === "masuk" ? "success" : undefined}>
          <Angka>
            {t.jenis === "masuk" ? "+" : "−"}
            {rp(t.jumlah)}
          </Angka>
        </Typography.Text>
      ),
    },
  ];
  if (bolehBatal)
    kolom.push({
      title: "Aksi",
      width: 100,
      render: (_, t) => (
        <TombolLink
          bahaya
          onClick={() =>
            void tanya("Batalkan transaksi ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan transaksi" }).then(
              (alasan) => alasan && batal.mutate({ id: t.id, alasan }),
            )
          }
        >
          Batalkan
        </TombolLink>
      ),
    });

  return <DataTabel kolom={kolom} data={data ?? []} rowKey="id" minLebar={bolehBatal ? 620 : 520} kosong="Belum ada transaksi." />;
}
