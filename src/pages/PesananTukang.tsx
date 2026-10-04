import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import BagikanWA from "../components/BagikanWA";
import KirimKeLaporan from "../components/KirimKeLaporan";
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
  { title: "Tukang & supplier", dataIndex: "pemasok_nama" },
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
            minLebar={720}
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

  /** Tanpa `g`: bayar semua yang belum dibayar; dengan `g`: hanya satu tukang/supplier (boleh beberapa pembayaran per minggu). */
  async function catatPembayaran(g?: SiapBayar["pemasok"][number]) {
    if (!siap) return;
    const judul = g ? `Catat pembayaran ${rp(g.subtotal)} ke ${g.nama}?` : `Catat pembayaran ${rp(siap.total)} ke semua tukang & supplier?`;
    const teks = `Uang keluar dari Kas utama, tanggal ${tanggal(tgl)}. Tersimpan sebagai draf sampai dikirim ke laporan keuangan.`;
    if (!(await konfirmasi(judul, { teks, ok: "Catat pembayaran" }))) return;
    aksi.mutate({ path: "/pembayaran-pemasok", body: g ? { tanggal: tgl, pemasok_id: g.pemasok_id } : { tanggal: tgl } });
  }
  const sudahDibayar = siap?.pembayaran_ids ?? (siap?.sudah_dicatat_id ? [siap.sudah_dicatat_id] : []);

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
    {
      title: "Status",
      dataIndex: "dibatalkan",
      render: (v: boolean, p) =>
        v ? <Lencana warna="merah">dibatalkan</Lencana> : p.status_kirim === "draf" ? <Lencana warna="oranye">draf</Lencana> : <Lencana warna="hijau">terkirim</Lencana>,
    },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <Space size={0}>
          <TombolLink onClick={() => setLihat(p.id)}>Rincian</TombolLink>
          {!p.dibatalkan && p.status_kirim === "terkirim" && p.kiriman_id && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              terkunci · <Link to="/kiriman">batalkan kiriman</Link>
            </Typography.Text>
          )}
          {!p.dibatalkan && !(p.status_kirim === "terkirim" && p.kiriman_id) && (
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
      <PageHeader judul="Bayar tukang & supplier" sub="Utang ke tukang & supplier dibayar tiap Selasa; boleh per tukang atau sekaligus" />
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
          {sudahDibayar.length > 0 && (
            <Alert
              type="success"
              showIcon
              title={`${sudahDibayar.length} pembayaran Selasa ini sudah dicatat.`}
              action={<TombolLink onClick={() => setLihat(sudahDibayar[sudahDibayar.length - 1])}>Lihat rincian</TombolLink>}
            />
          )}
          {siap.pemasok.length === 0 && sudahDibayar.length === 0 && <Kosong teks="Tidak ada utang ke tukang & supplier untuk Selasa ini. Order muncul di sini setelah barang diambil/diterima (Senin–Sabtu minggu lalu)." />}
          {siap.pemasok.map((g) => (
            <Card
              key={g.pemasok_id}
              judul={`${g.nama} · ${g.jenis === "supplier" ? "supplier" : "tukang"}`}
              aksi={
                <Space wrap>
                  <a href={apiUrl(`/po/${g.pemasok_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                    PDF rekap pembayaran
                  </a>
                  <BagikanWA jenis="po" id={g.pemasok_id} tanggal={tgl} label="Kirim rekap" />
                  <Button kecil disabled={aksi.isPending} onClick={() => void catatPembayaran(g)}>
                    Bayar {rp(g.subtotal)}
                  </Button>
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
          {siap.pemasok.length > 0 && (
            <Card>
              <Flex wrap justify="space-between" align="center" gap="middle">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Belum dibayar: {rp(siap.total)}
                </Typography.Title>
                <Button disabled={aksi.isPending} onClick={() => void catatPembayaran()}>
                  Bayar semua
                </Button>
              </Flex>
              <Typography.Text type="secondary">Setiap pembayaran menjadi 1 transaksi dengan rincian barang di dalamnya. Boleh dibayar per tukang di kartu masing-masing.</Typography.Text>
            </Card>
          )}
        </>
      )}

      <Card judul="Riwayat pembayaran">
        <div style={{ marginBottom: 12 }}>
          <KirimKeLaporan sumber="pembayaran_pemasok" />
        </div>
        <DataTabel kolom={kolomRiwayat} data={riwayatQ.data ?? []} rowKey="id" minLebar={720} kosong="Belum ada pembayaran ke tukang & supplier." />
      </Card>
      {lihat && <Rincian id={lihat} onTutup={() => setLihat(null)} />}
    </>
  );
}
