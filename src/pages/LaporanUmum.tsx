import { useQuery } from "@tanstack/react-query";
import { Alert, Col, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ringkasDraf, teksDraf, waktu } from "../lib/kiriman";
import { Angka, Baris, BarisTotal, Card, DataTabel, ErrorBox, Field, InputTanggal, Memuat, PageHeader } from "../components/ui";
import { api, query } from "../lib/api";
import { hariIni, num, rp, tanggal } from "../lib/format";
import type { BarisKategori, LaporanUmum } from "../lib/types";

const kolomKategori: TableColumnsType<BarisKategori> = [
  { title: "Kategori", dataIndex: "kategori" },
  { title: "Transaksi", dataIndex: "jumlah_transaksi", align: "right", width: 100, render: (v: number) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
  { title: "Jumlah", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

function TabelKategori({ judul, baris, total, labelTotal }: { judul: string; baris: BarisKategori[]; total?: string; labelTotal?: string }) {
  return (
    <Card judul={judul}>
      <DataTabel
        kolom={kolomKategori}
        data={baris}
        rowKey="kategori"
        minLebar={320}
        kosong="Tidak ada."
        ringkasan={total !== undefined && baris.length > 0 ? () => <BarisTotal sel={[{ isi: labelTotal ?? "Total", span: 2 }, { isi: rp(total), kanan: true }]} /> : undefined}
      />
    </Card>
  );
}

export default function LaporanUmumPage() {
  const awalBulan = `${hariIni().slice(0, 7)}-01`;
  const [dari, setDari] = useState(awalBulan);
  const [sampai, setSampai] = useState(hariIni());
  const q = useQuery({
    queryKey: ["laporan-umum", dari, sampai],
    queryFn: () => api<LaporanUmum>(`/laporan/umum${query({ dari, sampai })}`),
    enabled: !!dari && !!sampai,
  });
  const d = q.data;
  const angka = (v: string) => <Angka>{rp(v)}</Angka>;
  const kolomArus: TableColumnsType<LaporanUmum["arus_kas"][number]> = [
    { title: "Akun kas", dataIndex: "nama", fixed: "left", width: 150 },
    { title: "Saldo awal", dataIndex: "saldo_awal", align: "right", render: angka },
    { title: "Masuk", dataIndex: "masuk", align: "right", render: angka },
    { title: "Keluar", dataIndex: "keluar", align: "right", render: angka },
    { title: "Transfer masuk", dataIndex: "transfer_masuk", align: "right", render: angka },
    { title: "Transfer keluar", dataIndex: "transfer_keluar", align: "right", render: angka },
    { title: "Saldo akhir", dataIndex: "saldo_akhir", align: "right", render: (v: string) => <Typography.Text strong>{angka(v)}</Typography.Text> },
  ];

  return (
    <>
      <PageHeader judul="Laba rugi" sub="Pemasukan, biaya, laba bersih, dan arus kas per akun kas" aksi={<Link to="/laporan/kas-kecil">Laporan kas kecil →</Link>} />
      {d?.dari_snapshot && (
        <Alert type="success" showIcon style={{ marginBottom: 16 }} title={`Bulan ini sudah tutup buku${d.ditutup_pada ? ` (${waktu(d.ditutup_pada)})` : ""}: angka terkunci dari snapshot.`} />
      )}
      {d?.draf_belum_dikirim && d.draf_belum_dikirim.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`${teksDraf(ringkasDraf(d.draf_belum_dikirim))} belum dikirim, jadi belum dihitung di laporan ini.`}
          action={<Link to="/kiriman">Kirim sekarang</Link>}
        />
      )}
      <Card>
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Field label="Dari">
              <InputTanggal value={dari} onChange={setDari} />
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Sampai">
              <InputTanggal value={sampai} onChange={setSampai} />
            </Field>
          </Col>
        </Row>
      </Card>

      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {d && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <TabelKategori judul="Pemasukan" baris={d.pemasukan} total={d.total_pemasukan} labelTotal="Total pemasukan" />
            </Col>
            <Col xs={24} lg={12}>
              <TabelKategori judul="Biaya" baris={d.biaya} total={d.total_biaya} labelTotal="Total biaya" />
            </Col>
          </Row>
          <Card>
            <Row justify="space-between" align="middle">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Laba bersih
              </Typography.Title>
              <Typography.Title level={4} type={num(d.laba_bersih) < 0 ? "danger" : "success"} style={{ margin: 0 }}>
                <Angka>{rp(d.laba_bersih)}</Angka>
              </Typography.Title>
            </Row>
            {d.belum_cair !== undefined && num(d.belum_cair) !== 0 && (
              <div data-belum-cair>
                <Baris kiri={<Link to="/laporan/belum-cair">Penjualan belum cair per {tanggal(d.sampai)} (tidak masuk laba)</Link>} kanan={rp(d.belum_cair)} />
                {d.perkiraan_laba_jika_cair && <Baris kiri="Perkiraan laba jika semua cair (informasi saja)" kanan={rp(d.perkiraan_laba_jika_cair)} />}
              </div>
            )}
          </Card>
          {d.di_luar_laba.length > 0 && <TabelKategori judul="Di luar laba (prive, bagi hasil)" baris={d.di_luar_laba} />}

          <Card judul={`Arus kas ${tanggal(d.dari)} – ${tanggal(d.sampai)}`}>
            <DataTabel
              kolom={kolomArus}
              data={d.arus_kas}
              rowKey="akun_id"
              minLebar={820}
              ringkasan={() => <BarisTotal sel={[{ isi: "Total kas" }, { isi: rp(d.total_kas_awal), kanan: true }, { isi: "", span: 4 }, { isi: rp(d.total_kas_akhir), kanan: true }]} />}
            />
          </Card>
        </>
      )}
    </>
  );
}
