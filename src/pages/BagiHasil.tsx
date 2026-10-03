import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Col, Divider, Row, Space, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Angka, Baris, Button, Card, DataTabel, ErrorBox, Field, InputTanggal, Lencana, Memuat, PageHeader, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { useAksi } from "../lib/data";
import { bulanIni, bulanTahun, hariIni, num, rp, tanggal } from "../lib/format";
import type { BagiHasil, BagiHasilHitung } from "../lib/types";

export default function BagiHasilPage() {
  const [periode, setPeriode] = useState(bulanIni());
  const hitungQ = useQuery({ queryKey: ["bagi-hasil-hitung", periode], queryFn: () => api<BagiHasilHitung>(`/bagi-hasil/hitung${query({ periode })}`) });
  const daftarQ = useQuery({ queryKey: ["bagi-hasil"], queryFn: () => api<BagiHasil[]>("/bagi-hasil") });
  const aksi = useAksi();
  const { konfirmasiTanggal, tanya } = useDialog();
  const h = hitungQ.data;
  const adaAktif = (daftarQ.data ?? []).some((b) => b.periode === periode && !b.dibatalkan);

  const persen = (n: string) => <Typography.Text type="secondary">({num(n)}%)</Typography.Text>;
  const kolom: TableColumnsType<BagiHasil> = [
    { title: "Periode", dataIndex: "periode", fixed: "left", width: 130, render: (v: string) => bulanTahun(v) },
    { title: "Laba bersih", dataIndex: "laba_bersih", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    { title: "Admin", align: "right", render: (_, b) => <Angka>{rp(b.bagian_admin)} {persen(b.persen_admin)}</Angka> },
    { title: "Owner", align: "right", render: (_, b) => <Angka>{rp(b.bagian_owner)} {persen(b.persen_owner)}</Angka> },
    {
      title: "Status",
      render: (_, b) => (b.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : b.tanggal_bayar ? <Lencana warna="hijau">dibayar {tanggal(b.tanggal_bayar)}</Lencana> : <Lencana warna="oranye">draft</Lencana>),
    },
    {
      title: "Aksi",
      width: 150,
      render: (_, b) => (
        <Space size={0}>
          {!b.dibatalkan && !b.tanggal_bayar && num(b.bagian_admin) + num(b.bagian_owner) > 0 && (
            <TombolLink
              onClick={() =>
                void konfirmasiTanggal(`Bayar bagi hasil ${bulanTahun(b.periode)}?`, {
                  awal: hariIni(),
                  teks: `${rp(num(b.bagian_admin) + num(b.bagian_owner))} dibayar dari Kas utama.`,
                  label: "Tanggal bayar",
                  ok: "Bayar",
                }).then((tgl) => tgl && aksi.mutate({ path: `/bagi-hasil/${b.id}/bayar${query({ tanggal: tgl })}` }))
              }
            >
              Bayar
            </TombolLink>
          )}
          {!b.dibatalkan && (
            <TombolLink
              bahaya
              onClick={() =>
                void tanya("Batalkan / hitung ulang bagi hasil?", { label: "Alasan", min: 3, panjang: true, ok: "Batalkan" }).then(
                  (alasan) => alasan && aksi.mutate({ path: `/bagi-hasil/${b.id}/batal`, body: { alasan } }),
                )
              }
            >
              Batalkan
            </TombolLink>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader judul="Bagi hasil bulanan" sub="Admin dan owner, dihitung dari laba bersih tiap bulan" />
      <Card>
        <Row>
          <Col xs={24} md={8}>
            <Field label="Periode">
              <InputTanggal bulan value={periode} onChange={setPeriode} />
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={hitungQ.error ?? daftarQ.error ?? aksi.error} />
      {hitungQ.isLoading && <Memuat />}
      {h && (
        <Card judul={`Pratinjau ${h.periode}`}>
          <Baris kiri="Pemasukan" kanan={rp(h.pemasukan)} />
          <Baris kiri="Biaya" kanan={rp(h.pengeluaran)} />
          <Baris kiri="Laba bersih" kanan={<Typography.Text type={num(h.laba_bersih) < 0 ? "danger" : "success"}>{rp(h.laba_bersih)}</Typography.Text>} tebal />
          <Divider style={{ margin: "8px 0" }} />
          <Baris kiri={`Admin (${num(h.persen_admin)}%)`} kanan={rp(h.bagian_admin)} />
          <Baris kiri={`Owner (${num(h.persen_owner)}%)`} kanan={rp(h.bagian_owner)} />
          {num(h.laba_bersih) <= 0 && <Typography.Paragraph type="secondary">Laba nol atau rugi: tidak ada bagi hasil (kerugian tidak dibawa ke bulan berikutnya).</Typography.Paragraph>}
          <div style={{ marginTop: 16 }}>
            <Button disabled={aksi.isPending || adaAktif} onClick={() => aksi.mutate({ path: "/bagi-hasil", body: { periode } })}>
              {adaAktif ? "Sudah disimpan" : "Simpan perhitungan"}
            </Button>
          </div>
        </Card>
      )}
      <Card judul="Riwayat bagi hasil">
        <DataTabel kolom={kolom} data={daftarQ.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada bagi hasil tersimpan." />
      </Card>
    </>
  );
}
