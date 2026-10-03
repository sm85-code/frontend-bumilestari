import { useQuery } from "@tanstack/react-query";
import { PlusOutlined } from "@ant-design/icons";
import { Col, Flex, Row } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Memuat, PageHeader, Select } from "../components/ui";
import { api, query } from "../lib/api";
import { num, rp } from "../lib/format";
import type { AkunKas, Kategori, Transaksi } from "../lib/types";

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

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  const akun = akunQ.data ?? [];
  const total = akun.reduce((t, a) => t + num(a.saldo), 0);

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
          </Flex>
        </Col>
      </Row>
    </>
  );
}
