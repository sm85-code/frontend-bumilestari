import { useQuery } from "@tanstack/react-query";
import { Col, Flex, Row, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Link } from "react-router-dom";
import { Angka, Baris, BarisTotal, Card, DataTabel, ErrorBox, Memuat, PageHeader, Progress, Stat } from "../components/ui";
import { api } from "../lib/api";
import { num, rp, tanggal } from "../lib/format";
import type { Dashboard, Imprest } from "../lib/types";

const STATUS_LABEL: Record<string, string> = {
  dipesan: "Dipesan",
  dikerjakan: "Dikerjakan",
  diambil: "Diambil",
  diterima: "Diterima",
  dicat: "Dicat",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

function KartuImprest({ judul, data, ke }: { judul: string; data: Imprest; ke?: string }) {
  const perlu = num(data.perlu_diisi);
  return (
    <Card judul={judul} aksi={ke ? <Link to={ke}>Lihat</Link> : undefined}>
      <Flex justify="space-between" align="baseline">
        <Typography.Title level={4} style={{ margin: 0 }}>
          <Angka>{rp(data.saldo)}</Angka>
        </Typography.Title>
        <Typography.Text type="secondary">jatah {rp(data.plafon)}</Typography.Text>
      </Flex>
      <Progress nilai={num(data.saldo)} maks={num(data.plafon)} />
      <Typography.Text type={perlu > 0 ? "warning" : "secondary"} strong={perlu > 0}>
        {perlu > 0 ? `Perlu diisi ${rp(perlu)} hari Selasa` : "Sudah penuh"}
      </Typography.Text>
    </Card>
  );
}

interface BarisSaldo {
  id: string;
  nama: string;
  saldo: string | number;
}
const kolomSaldo: TableColumnsType<BarisSaldo> = [
  { title: "Akun", dataIndex: "nama" },
  { title: "Saldo", dataIndex: "saldo", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

export default function Beranda() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });

  if (isLoading) return <Memuat />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Data tidak tersedia")} />;

  const laba = num(data.laba_bulan_ini);
  const status = Object.entries(data.order_per_status);
  return (
    <>
      <PageHeader judul="Beranda" sub={`Selasa acuan ${tanggal(data.selasa)}`} />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Stat label="Total kas" nilai={rp(data.total_kas)} />
        </Col>
        <Col xs={12} md={6}>
          <Stat label={`Laba ${data.periode}`} nilai={rp(data.laba_bulan_ini)} warna={laba < 0 ? "merah" : "hijau"} sub={`Masuk ${rp(data.pemasukan_bulan_ini)}`} />
        </Col>
        <Col xs={12} md={6}>
          <Stat label="Bayar tukang Selasa ini" nilai={rp(data.utang_pemasok_siap_bayar)} warna="oranye" />
        </Col>
        <Col xs={12} md={6}>
          <Stat label="Tagihan penjual lain" nilai={rp(data.piutang_penjual_lain)} sub="belum dibayar" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Flex vertical gap="middle">
            <Card judul="Order">
              <Typography.Paragraph>
                <b>{data.order_bulan_ini}</b> order bulan ini · omzet <b>{rp(data.omzet_order_bulan_ini)}</b>
              </Typography.Paragraph>
              {status.length === 0 ? (
                <Typography.Text type="secondary">Belum ada order</Typography.Text>
              ) : (
                <Flex wrap gap={4}>
                  {status.map(([s, n]) => (
                    <Tag key={s} color="success">
                      {STATUS_LABEL[s] ?? s}: <b>{n}</b>
                    </Tag>
                  ))}
                </Flex>
              )}
            </Card>
            {data.kas_kecil && <KartuImprest judul="Kas kecil" data={data.kas_kecil} ke="/kas-kecil" />}
            {data.kas_iklan && <KartuImprest judul="Kas iklan (admin)" data={data.kas_iklan} />}
          </Flex>
        </Col>
        <Col xs={24} md={12}>
          <Card judul="Saldo akun">
            <DataTabel
              kolom={kolomSaldo}
              data={[...data.akun.map((a) => ({ id: a.id, nama: a.nama, saldo: a.saldo })), { id: "cadangan", nama: "Dana cadangan (gaji)", saldo: data.dana_cadangan }]}
              rowKey="id"
              minLebar={300}
              ringkasan={() => <BarisTotal sel={[{ isi: "Total kas" }, { isi: rp(data.total_kas), kanan: true }]} />}
            />
          </Card>
        </Col>
      </Row>

      {data.bagian_admin_pratinjau !== null && data.bagian_owner_pratinjau !== null && (
        <Card judul={`Pratinjau bagi hasil ${data.periode}`}>
          <Baris kiri="Admin" kanan={rp(data.bagian_admin_pratinjau)} />
          <Baris kiri="Owner" kanan={rp(data.bagian_owner_pratinjau)} />
          <Typography.Text type="secondary">Dihitung dari laba bulan berjalan; angka final saat bagi hasil disimpan.</Typography.Text>
        </Card>
      )}
    </>
  );
}
