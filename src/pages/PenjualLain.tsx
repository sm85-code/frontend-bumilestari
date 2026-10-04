import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BagikanWA from "../components/BagikanWA";
import { Col, Flex, Row, Space, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Link } from "react-router-dom";
import KirimKeLaporan from "../components/KirimKeLaporan";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, InputTanggal, Kosong, Lencana, Memuat, PageHeader, TombolLink, useDialog } from "../components/ui";
import { api, apiUrl, query } from "../lib/api";
import { peta, usePelanggan, useAksi } from "../lib/data";
import { hariIni, rp, tanggal } from "../lib/format";
import type { Invoice, PenerimaanReseller } from "../lib/types";

export default function PenjualLain() {
  const [tgl, setTgl] = useState(hariIni());
  const invQ = useQuery({ queryKey: ["invoice", tgl], queryFn: () => api<Invoice[]>(`/invoice-reseller${query({ tanggal: tgl })}`) });
  const terimaQ = useQuery({ queryKey: ["penerimaan"], queryFn: () => api<PenerimaanReseller[]>("/penerimaan-reseller") });
  const pelanggan = peta(usePelanggan().data);
  const aksi = useAksi();
  const { konfirmasiTanggal, tanya } = useDialog();

  async function catatBayar(inv: Invoice) {
    const tglBayar = await konfirmasiTanggal(`Catat pembayaran ${rp(inv.grand_total)} dari ${inv.kepada.nama}?`, {
      awal: hariIni(),
      teks: `${inv.items.length} order. Uang masuk ke Kas utama.`,
      label: "Tanggal uang diterima",
      ok: "Catat pembayaran",
    });
    if (!tglBayar) return;
    aksi.mutate({
      path: "/penerimaan-reseller",
      body: { pelanggan_id: inv.kepada.pelanggan_id, tanggal: tglBayar, order_ids: inv.items.map((i) => i.order_id) },
    });
  }

  const angka = (v: string) => <Angka>{rp(v)}</Angka>;
  const kolomInvoice: TableColumnsType<Invoice["items"][number]> = [
    {
      title: "Tanggal kirim",
      fixed: "left",
      width: 140,
      render: (_, i) => (
        <Space size={4} wrap={false}>
          <Angka>{tanggal(i.tanggal)}</Angka>
          {i.terlambat && <Lencana warna="oranye">terlambat</Lencana>}
        </Space>
      ),
    },
    { title: "Nama barang", dataIndex: "nama_barang" },
    { title: "Ukuran", dataIndex: "ukuran", width: 120 },
    { title: "Harga barang", dataIndex: "harga_barang", align: "right", render: angka },
    { title: "Jasa pengecatan", dataIndex: "biaya_jasa_pengecatan", align: "right", render: angka },
    { title: "Biaya proses", dataIndex: "biaya_proses", align: "right", render: angka },
    { title: "Total", dataIndex: "total", align: "right", render: (v: string) => <Typography.Text strong>{angka(v)}</Typography.Text> },
  ];
  const kolomTerima: TableColumnsType<PenerimaanReseller> = [
    { title: "Tanggal", dataIndex: "tanggal", fixed: "left", width: 110, render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Penjual lain", dataIndex: "pelanggan_id", render: (v: string) => pelanggan.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "total", align: "right", render: angka },
    {
      title: "Status",
      dataIndex: "dibatalkan",
      render: (v: boolean, p) =>
        v ? <Lencana warna="merah">dibatalkan</Lencana> : p.status_kirim === "draf" ? <Lencana warna="oranye">draf</Lencana> : <Lencana warna="hijau">terkirim</Lencana>,
    },
    {
      title: "Aksi",
      width: 100,
      render: (_, p) =>
        !p.dibatalkan &&
        (p.status_kirim === "terkirim" && p.kiriman_id ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            terkunci · <Link to="/kiriman">batalkan kiriman</Link>
          </Typography.Text>
        ) : (
          <TombolLink
            bahaya
            onClick={() =>
              void tanya("Batalkan pembayaran ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan pembayaran" }).then(
                (alasan) => alasan && aksi.mutate({ path: `/penerimaan-reseller/${p.id}/batal`, body: { alasan } }),
              )
            }
          >
            Batalkan
          </TombolLink>
        )),
    },
  ];

  return (
    <>
      <PageHeader judul="Tagihan penjual lain" sub="Tagihan (invoice) mingguan per penjual lain dan pembayaran yang diterima" />
      <Card>
        <Row>
          <Col xs={24} md={8}>
            <Field label="Tanggal acuan" hint="Invoice minggu sebelum Selasa acuan: bertanggal Sabtu, jatuh tempo Selasa">
              <InputTanggal value={tgl} onChange={setTgl} />
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={invQ.error ?? aksi.error} />
      {invQ.isLoading && <Memuat />}
      {invQ.data?.length === 0 && <Kosong teks="Tidak ada tagihan penjual lain untuk Selasa ini. Tagihan berisi order penjual lain yang dikirim Senin–Sabtu minggu lalu." />}
      {invQ.data?.map((inv) => (
        <Card
          key={inv.nomor}
          judul={`${inv.kepada.nama} · ${inv.nomor}`}
          aksi={
            <Space wrap>
              <a href={apiUrl(`/invoice-reseller/${inv.kepada.pelanggan_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                PDF invoice
              </a>
              <BagikanWA jenis="invoice" id={inv.kepada.pelanggan_id} tanggal={tgl} label="Kirim invoice" />
            </Space>
          }
        >
          <Typography.Paragraph type="secondary">
            {inv.minggu.label} · tanggal invoice {tanggal(inv.tgl_invoice)} · jatuh tempo <b>{tanggal(inv.jatuh_tempo)}</b>
          </Typography.Paragraph>
          <DataTabel
            kolom={kolomInvoice}
            data={inv.items}
            rowKey="order_id"
            minLebar={800}
            ringkasan={() => (
              <BarisTotal
                sel={[
                  { isi: "Grand total", span: 3 },
                  { isi: rp(inv.total_barang), kanan: true },
                  { isi: rp(inv.total_jasa_pengecatan), kanan: true },
                  { isi: rp(inv.total_biaya_proses), kanan: true },
                  { isi: rp(inv.grand_total), kanan: true },
                ]}
              />
            )}
          />
          <Flex justify="flex-end" style={{ marginTop: 16 }}>
            <Button disabled={aksi.isPending} onClick={() => void catatBayar(inv)}>
              Catat pembayaran diterima
            </Button>
          </Flex>
        </Card>
      ))}

      <Card judul="Riwayat pembayaran diterima">
        <div style={{ marginBottom: 12 }}>
          <KirimKeLaporan sumber="penerimaan_reseller" />
        </div>
        <DataTabel kolom={kolomTerima} data={terimaQ.data ?? []} rowKey="id" minLebar={720} kosong="Belum ada pembayaran diterima dari penjual lain." />
      </Card>
    </>
  );
}
