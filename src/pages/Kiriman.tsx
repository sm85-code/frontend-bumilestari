import { Flex, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import KirimKeLaporan from "../components/KirimKeLaporan";
import { Angka, Card, DataTabel, ErrorBox, Lencana, Memuat, PageHeader, Select, TombolLink, useDialog } from "../components/ui";
import { useAksi } from "../lib/data";
import { rp, tanggal } from "../lib/format";
import { LABEL_SUMBER, sumberUntuk, useRiwayatKiriman, waktu } from "../lib/kiriman";
import type { Kiriman, SumberKiriman } from "../lib/types";

/**
 * Kirim ke laporan keuangan & riwayat kiriman (spesifikasi 1.13). Satu kiriman = satu kelompok catatan draf yang
 * dikirim bersama. Membatalkan kiriman (wajib alasan, hanya selama bulannya belum ditutup) mengembalikan catatannya
 * menjadi draf sehingga bisa dikoreksi lalu dikirim ulang; kiriman yang dibatalkan tetap tercatat sebagai riwayat.
 */
export default function KirimanPage() {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const [filter, setFilter] = useState<SumberKiriman | "">("");
  const riwayat = useRiwayatKiriman(filter || undefined);
  const aksi = useAksi();
  const { tanya } = useDialog();

  async function batal(k: Kiriman) {
    const alasan = await tanya(`Batalkan kiriman ${k.nomor}?`, {
      label: `${k.jumlah_entri} catatan (${rp(k.total)}) kembali menjadi draf dan keluar dari laporan. Tulis alasannya.`,
      min: 3,
      panjang: true,
      ok: "Batalkan kiriman",
    });
    if (alasan) aksi.mutate({ path: `/kiriman/${k.id}/batal`, body: { alasan } });
  }

  const kolom: TableColumnsType<Kiriman> = [
    { title: "Nomor", dataIndex: "nomor" },
    { title: "Sumber", dataIndex: "sumber", render: (s: SumberKiriman) => LABEL_SUMBER[s] ?? s },
    { title: "Dikirim", dataIndex: "dikirim_pada", render: (v: string) => waktu(v) },
    { title: "Sampai tanggal", dataIndex: "sampai_tanggal", render: (v: string | null) => (v ? tanggal(v) : "Semua") },
    { title: "Catatan", dataIndex: "jumlah_entri", align: "right" },
    { title: "Total", dataIndex: "total", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    {
      title: "Status",
      render: (_, k) =>
        k.status === "terkirim" ? (
          <Lencana warna="hijau">Terkirim</Lencana>
        ) : (
          <Flex vertical>
            <Lencana warna="merah">Dibatalkan</Lencana>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {waktu(k.dibatalkan_pada)} · {k.alasan_batal}
            </Typography.Text>
          </Flex>
        ),
    },
    {
      title: "",
      render: (_, k) =>
        k.status === "terkirim" && (k.sumber !== "kas_iklan" || admin) ? (
          <TombolLink bahaya disabled={aksi.isPending} onClick={() => void batal(k)}>
            Batalkan kiriman
          </TombolLink>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader judul="Kirim ke laporan keuangan" sub="Catatan draf baru masuk laporan, saldo resmi dan laba setelah dikirim. Setelah dikirim catatan terkunci." />
      <Card judul="Belum dikirim">
        <Flex vertical gap="middle">
          {sumberUntuk(admin).map((s) => (
            <div key={s}>
              <Typography.Text strong>{LABEL_SUMBER[s]}</Typography.Text>
              <KirimKeLaporan sumber={s} tanpaTautan />
            </div>
          ))}
        </Flex>
      </Card>
      <Card
        judul="Riwayat kiriman"
        aksi={
          <Select aria-label="Saring sumber" value={filter} onChange={(e) => setFilter(e.target.value as SumberKiriman | "")}>
            <option value="">Semua sumber</option>
            {sumberUntuk(admin).map((s) => (
              <option key={s} value={s}>
                {LABEL_SUMBER[s]}
              </option>
            ))}
          </Select>
        }
      >
        <ErrorBox error={riwayat.error ?? aksi.error} />
        {riwayat.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={riwayat.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada kiriman" />}
        <Typography.Text type="secondary">Pembatalan hanya bisa selama bulannya belum ditutup buku.</Typography.Text>
      </Card>
    </>
  );
}
