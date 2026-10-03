import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TableColumnsType } from "antd";
import { Typography } from "antd";
import { Angka, DataTabel, Memuat, TombolLink, useDialog } from "./ui";
import { OtomatisDari } from "./OtomatisDari";
import { api } from "../lib/api";
import { rp, tanggal } from "../lib/format";
import { labelKategori } from "../lib/kategori";
import { sumberTransaksi } from "../lib/sumber";
import type { Kategori, Transaksi } from "../lib/types";

export const TEKS_SALAH_CATAT = "Salah catat? Minta admin membatalkan.";

/**
 * Riwayat transaksi sebagai tabel (digulir ke samping di layar sempit).
 * Transaksi otomatis (punya `ref_jenis`) tidak bisa dibatalkan di sini: tampil tautan ke halaman asalnya.
 * Staf tidak bisa membatalkan: setiap baris memuat teks "Salah catat? Minta admin membatalkan."
 */
export default function DaftarTransaksi({
  data,
  kategori,
  bolehBatal,
  memuat,
  staf,
  kosong = "Belum ada transaksi.",
}: {
  data: Transaksi[] | undefined;
  kategori: Kategori[];
  bolehBatal: boolean;
  memuat?: boolean;
  staf?: boolean;
  kosong?: string;
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
    { title: "Kategori", dataIndex: "kategori_id", width: 160, render: (v: string) => labelKategori(nama.get(v)) },
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
      width: 190,
      render: (_, t) => {
        const sumber = sumberTransaksi(t);
        if (sumber) return <OtomatisDari sumber={sumber} />;
        return (
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
        );
      },
    });
  else if (staf)
    kolom.push({
      title: "",
      key: "salah-catat",
      width: 170,
      render: () => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {TEKS_SALAH_CATAT}
        </Typography.Text>
      ),
    });

  return <DataTabel kolom={kolom} data={data ?? []} rowKey="id" minLebar={bolehBatal || staf ? 680 : 520} kosong={kosong} />;
}
