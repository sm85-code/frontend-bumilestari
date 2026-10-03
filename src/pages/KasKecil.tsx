import { useQuery } from "@tanstack/react-query";
import { Col, Flex, Row, Typography } from "antd";
import { Link } from "react-router-dom";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Angka, Card, ErrorBox, Memuat, PageHeader, Progress } from "../components/ui";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { api, query } from "../lib/api";
import { num, rp } from "../lib/format";
import type { AkunKas, Kategori, Transaksi } from "../lib/types";

export default function KasKecil() {
  const { user } = useAuth();
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const kas = akunQ.data?.find((a) => a.jenis === "kas_kecil");
  const trxQ = useQuery({
    queryKey: ["transaksi", kas?.id],
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: kas?.id })}`),
    enabled: !!kas,
  });

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  if (!kas) return <ErrorBox error={new Error("Akun kas kecil belum tersedia. Minta admin menjalankan seed-now.")} />;

  const saldo = num(kas.saldo);
  const plafon = num(kas.plafon);
  return (
    <>
      <PageHeader judul="Kas kecil" sub="Pegangan staf, diisi kembali ke jatah tiap Selasa" />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Flex vertical gap="middle">
            <Card judul="Kas kecil">
              <Typography.Title level={2} style={{ margin: 0 }}>
                <Angka>{rp(saldo)}</Angka>
              </Typography.Title>
              <Typography.Paragraph type="secondary">dari jatah {rp(plafon)}</Typography.Paragraph>
              <Progress nilai={saldo} maks={plafon} />
              <Typography.Text type="secondary">Diisi kembali ke jatah setiap hari Selasa.</Typography.Text>
            </Card>
            <Card judul="Catat pengeluaran">
              <FormTransaksi akun={[kas]} kategori={katQ.data ?? []} jenisTetap="keluar" akunAwal={kas.id} />
            </Card>
          </Flex>
        </Col>
        <Col xs={24} lg={16}>
          <Card judul="Riwayat" aksi={<Link to="/laporan/kas-kecil">Laporan bulanan</Link>}>
            <DaftarTransaksi data={trxQ.data} kategori={katQ.data ?? []} bolehBatal={isPemilik(user?.role)} memuat={trxQ.isLoading} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
