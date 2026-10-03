import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BagikanWA from "../components/BagikanWA";
import { Alert, Col, Flex, Row, Space, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Angka, BarisTotal, Button, Card, DataTabel, Dialog, ErrorBox, Field, InputTanggal, Kosong, Lencana, Memuat, PageHeader, TombolLink, useDialog } from "../components/ui";
import { api, apiUrl, query } from "../lib/api";
import { peta, useAksi, useProduk } from "../lib/data";
import { hariIni, rp, tanggal } from "../lib/format";
import type { PembayaranPemasok, RincianPembayaran, SiapBayar } from "../lib/types";

const kolomRincian: TableColumnsType<RincianPembayaran["items"][number]> = [
  { title: "Kode pesanan", dataIndex: "no_order", fixed: "left", width: 150, render: (v: string) => v || "—" },
  { title: "Barang", dataIndex: "produk_nama" },
  { title: "Pemasok", dataIndex: "pemasok_nama" },
  { title: "Qty", dataIndex: "qty", align: "right", width: 70 },
  { title: "Jumlah", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

function Rincian({ id, onTutup }: { id: string; onTutup: () => void }) {
  const q = useQuery({ queryKey: ["pembayaran", id], queryFn: () => api<RincianPembayaran>(`/pembayaran-pemasok/${id}`) });
  return (
    <Dialog judul="Rincian pembayaran" onTutup={onTutup}>
      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {q.data && (
        <>
          <Typography.Paragraph type="secondary">
            Di laporan keuangan tampil sebagai <b>1 transaksi</b> {rp(q.data.total)}; isinya {q.data.total_qty} barang:
          </Typography.Paragraph>
          <DataTabel
            kolom={kolomRincian}
            data={q.data.items}
            rowKey="order_id"
            minLebar={520}
            ringkasan={() => <BarisTotal sel={[{ isi: "Total", span: 3 }, { isi: q.data.total_qty, kanan: true }, { isi: rp(q.data.total), kanan: true }]} />}
          />
        </>
      )}
    </Dialog>
  );
}

export default function PesananTukang() {
  const [tgl, setTgl] = useState(hariIni());
  const [lihat, setLihat] = useState<string | null>(null);
  const siapQ = useQuery({ queryKey: ["siap-bayar", tgl], queryFn: () => api<SiapBayar>(`/pembayaran-pemasok/siap${query({ tanggal: tgl })}`) });
  const riwayatQ = useQuery({ queryKey: ["pembayaran-pemasok"], queryFn: () => api<PembayaranPemasok[]>("/pembayaran-pemasok") });
  const produk = peta(useProduk().data);
  const aksi = useAksi();
  const { konfirmasi, tanya } = useDialog();
  const siap = siapQ.data;

  async function kirimKeLaporan() {
    if (!siap || !(await konfirmasi(`Catat pembayaran ${rp(siap.total)} ke laporan keuangan?`, { ok: "Kirim ke laporan" }))) return;
    aksi.mutate({ path: "/pembayaran-pemasok", body: { tanggal: tgl } });
  }

  const angka = (v: string) => <Angka>{rp(v)}</Angka>;
  const kolomSiap: TableColumnsType<SiapBayar["pemasok"][number]["items"][number]> = [
    {
      title: "Tanggal selesai",
      fixed: "left",
      width: 150,
      render: (_, i) => (
        <Space size={4} wrap={false}>
          <Angka>{tanggal(i.tgl_diambil)}</Angka>
          {i.terlambat && <Lencana warna="oranye">terlambat</Lencana>}
        </Space>
      ),
    },
    { title: "Kode pesanan", dataIndex: "no_order", width: 150, render: (v: string) => v || "—" },
    {
      title: "Barang",
      render: (_, i) => (
        <>
          {produk.get(i.produk_id)?.nama ?? "—"} <Typography.Text type="secondary">{produk.get(i.produk_id)?.ukuran}</Typography.Text>
        </>
      ),
    },
    { title: "Qty", dataIndex: "qty", align: "right", width: 70 },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: angka },
  ];
  const kolomRiwayat: TableColumnsType<PembayaranPemasok> = [
    { title: "Selasa", dataIndex: "selasa", fixed: "left", width: 110, render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Tanggal catat", dataIndex: "tanggal", render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Total", dataIndex: "total", align: "right", render: angka },
    { title: "Status", dataIndex: "dibatalkan", render: (v: boolean) => (v ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">tercatat</Lencana>) },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <Space size={0}>
          <TombolLink onClick={() => setLihat(p.id)}>Rincian</TombolLink>
          {!p.dibatalkan && (
            <TombolLink
              bahaya
              onClick={() =>
                void tanya("Batalkan pembayaran ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan pembayaran" }).then(
                  (alasan) => alasan && aksi.mutate({ path: `/pembayaran-pemasok/${p.id}/batal`, body: { alasan } }),
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
      <PageHeader judul="Pesanan ke tukang" sub="Dibayar sekali tiap Selasa, dicatat sebagai 1 transaksi" />
      <Card>
        <Row>
          <Col xs={24} md={8}>
            <Field label="Tanggal pembayaran" hint="Diambil Senin–Sabtu minggu sebelum Selasa acuan ikut dibayar">
              <InputTanggal value={tgl} onChange={setTgl} />
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={siapQ.error ?? aksi.error} />
      {siapQ.isLoading && <Memuat />}
      {siap && (
        <>
          <Typography.Text type="secondary">
            Selasa acuan <b>{tanggal(siap.selasa)}</b> · diambil sampai <b>{tanggal(siap.batas_diambil)}</b> (Sabtu)
          </Typography.Text>
          {siap.sudah_dicatat_id && (
            <Alert
              type="success"
              showIcon
              title="Pembayaran Selasa ini sudah dicatat."
              action={
                <TombolLink onClick={() => setLihat(siap.sudah_dicatat_id)}>Lihat rincian</TombolLink>
              }
            />
          )}
          {siap.pemasok.length === 0 && !siap.sudah_dicatat_id && <Kosong teks="Tidak ada pesanan yang siap dibayar." />}
          {siap.pemasok.map((g) => (
            <Card
              key={g.pemasok_id}
              judul={`${g.nama} · ${g.jenis === "supplier" ? "supplier" : "tukang kayu"}`}
              aksi={
                <Space wrap>
                  <a href={apiUrl(`/po/${g.pemasok_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                    PDF PO
                  </a>
                  <BagikanWA jenis="po" id={g.pemasok_id} tanggal={tgl} label="Kirim PO" />
                </Space>
              }
            >
              <DataTabel
                kolom={kolomSiap}
                data={g.items}
                rowKey="order_id"
                minLebar={640}
                ringkasan={() => <BarisTotal sel={[{ isi: `Subtotal ${g.nama}`, span: 4 }, { isi: rp(g.subtotal), kanan: true }]} />}
              />
            </Card>
          ))}
          {siap.pemasok.length > 0 && !siap.sudah_dicatat_id && (
            <Card>
              <Flex wrap justify="space-between" align="center" gap="middle">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Total dibayar Selasa: {rp(siap.total)}
                </Typography.Title>
                <Button disabled={aksi.isPending} onClick={() => void kirimKeLaporan()}>
                  Kirim ke laporan
                </Button>
              </Flex>
              <Typography.Text type="secondary">Dicatat 1 kali per Selasa sebagai 1 transaksi; rincian barang tersimpan di dalamnya.</Typography.Text>
            </Card>
          )}
        </>
      )}

      <Card judul="Riwayat pembayaran">
        <DataTabel kolom={kolomRiwayat} data={riwayatQ.data ?? []} rowKey="id" minLebar={520} kosong="Belum ada pembayaran." />
      </Card>
      {lihat && <Rincian id={lihat} onTutup={() => setLihat(null)} />}
    </>
  );
}
