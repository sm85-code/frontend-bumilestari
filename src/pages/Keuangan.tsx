import { useQuery } from "@tanstack/react-query";
import { useAksi } from "../lib/data";
import { PlusOutlined } from "@ant-design/icons";
import { Col, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Lencana, Memuat, PageHeader, Select, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { num, rp, tanggal } from "../lib/format";
import type { AkunKas, Kategori, Transaksi, Transfer } from "../lib/types";

const JENIS: Record<string, string> = { kas: "Kas", bank: "Bank", ewallet: "E-wallet", kas_kecil: "Kas kecil", kas_iklan: "Kas iklan" };

const kolomAkun: TableColumnsType<AkunKas> = [
  { title: "Akun", dataIndex: "nama" },
  { title: "Jenis", dataIndex: "jenis", render: (v: string) => JENIS[v] ?? v },
  { title: "Saldo", dataIndex: "saldo", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

export default function Keuangan() {
  const [akunId, setAkunId] = useState("");
  const [form, setForm] = useState(false);
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const trxQ = useQuery({
    queryKey: ["transaksi", akunId || "semua"],
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: akunId })}`),
  });

  const transferQ = useQuery({ queryKey: ["transfer"], queryFn: () => api<Transfer[]>("/transfer?termasuk_batal=true") });
  const aksi = useAksi();
  const { tanya } = useDialog();

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  const akun = akunQ.data ?? [];
  const total = akun.reduce((t, a) => t + num(a.saldo), 0);
  const namaAkun = new Map(akun.map((a) => [a.id, a.nama]));
  const kolomTransfer: TableColumnsType<Transfer> = [
    { title: "Tanggal", dataIndex: "tanggal", fixed: "left", width: 110, render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Dari → ke", render: (_, t) => `${namaAkun.get(t.dari_akun_id) ?? "—"} → ${namaAkun.get(t.ke_akun_id) ?? "—"}` },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    { title: "Keterangan", dataIndex: "keterangan", render: (v: string) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
    { title: "Status", render: (_, t) => (t.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">tercatat</Lencana>) },
    {
      title: "Aksi",
      width: 100,
      render: (_, t) =>
        !t.dibatalkan && (
          <TombolLink
            bahaya
            disabled={aksi.isPending}
            onClick={() =>
              void tanya("Batalkan transfer ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan transfer" }).then(
                (alasan) => alasan && aksi.mutate({ path: `/transfer/${t.id}/batal`, body: { alasan } }),
              )
            }
          >
            Batalkan
          </TombolLink>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Keuangan"
        aksi={
          <Button variant={form ? "pinggir" : "utama"} onClick={() => setForm(!form)}>
            {form ? "Tutup formulir" : <><PlusOutlined /> Catat transaksi</>}
          </Button>
        }
      />
      <Row gutter={[16, 16]}>
        {form && (
          <Col xs={24} lg={8}>
            <Card judul="Transaksi baru">
              <FormTransaksi akun={akun} kategori={katQ.data ?? []} onSukses={() => setForm(false)} />
            </Card>
          </Col>
        )}
        <Col xs={24} lg={form ? 16 : 24}>
          <Flex vertical gap="middle">
            <Card judul="Saldo akun">
              <DataTabel
                kolom={kolomAkun}
                data={akun}
                rowKey="id"
                minLebar={360}
                ringkasan={() => <BarisTotal sel={[{ isi: "Total", span: 2 }, { isi: rp(total), kanan: true }]} />}
              />
            </Card>
            <Card judul="Riwayat transaksi">
              <Row>
                <Col xs={24} md={8}>
                  <Field label="Filter akun">
                    <Select value={akunId} onChange={(e) => setAkunId(e.target.value)}>
                      <option value="">Semua akun</option>
                      {akun.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nama}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </Col>
              </Row>
              <DaftarTransaksi data={trxQ.data} kategori={katQ.data ?? []} bolehBatal memuat={trxQ.isLoading} />
            </Card>
            <Card judul="Riwayat transfer antar akun">
              <ErrorBox error={transferQ.error ?? aksi.error} />
              <DataTabel kolom={kolomTransfer} data={transferQ.data ?? []} rowKey="id" minLebar={640} kosong="Belum ada transfer." />
            </Card>
          </Flex>
        </Col>
      </Row>
    </>
  );
}
