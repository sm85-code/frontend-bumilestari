import { useQuery } from "@tanstack/react-query";
import { useAksi } from "../lib/data";
import { PlusOutlined } from "@ant-design/icons";
import { Col, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import KirimKeLaporan from "../components/KirimKeLaporan";
import { OtomatisDari } from "../components/OtomatisDari";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Lencana, Memuat, PageHeader, Select, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { num, rp, tanggal } from "../lib/format";
import { LABEL_JENIS_TRANSFER, sumberTransfer } from "../lib/sumber";
import type { AkunKas, Kategori, Transaksi, Transfer } from "../lib/types";

const JENIS: Record<string, string> = { kas: "Kas", bank: "Bank", ewallet: "E-wallet", kas_kecil: "Kas kecil", kas_iklan: "Kas iklan" };

const kolomAkun: TableColumnsType<AkunKas> = [
  { title: "Akun kas", dataIndex: "nama" },
  { title: "Plafon", dataIndex: "plafon", align: "right", render: (v: string | null) => (v ? <Angka>{rp(v)}</Angka> : "—") },
  { title: "Jenis", dataIndex: "jenis", render: (v: string) => JENIS[v] ?? v },
  {
    title: "Saldo",
    dataIndex: "saldo",
    align: "right",
    render: (v: string, a) => (
      <>
        <Angka>{rp(v)}</Angka>
        {a.saldo_setelah_draf != null && num(a.saldo_setelah_draf) !== num(v) && (
          <div style={{ fontSize: 12, opacity: 0.7 }}>setelah draf {rp(a.saldo_setelah_draf)}</div>
        )}
      </>
    ),
  },
];

export default function Keuangan() {
  const [akunId, setAkunId] = useState("");
  const [form, setForm] = useState(false);
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const trxQ = useQuery({
    queryKey: ["transaksi", akunId || "semua", "draf"],
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: akunId, termasuk_draf: "true" })}`),
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
    {
      title: "Dari → ke",
      // Akun TALANGAN (kewajiban) tidak ada di daftar akun kas.
      render: (_, t) => `${namaAkun.get(t.dari_akun_id) ?? "—"} → ${namaAkun.get(t.ke_akun_id) ?? (t.jenis === "pelunasan_talangan" ? "Talangan" : "—")}`,
    },
    {
      title: "Jenis",
      dataIndex: "jenis",
      render: (v: string, t) => (
        <span>
          {LABEL_JENIS_TRANSFER[v] ?? v}
          {t.di_luar_jadwal && (
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }} title={t.alasan_luar_jadwal ?? undefined}>
              di luar jadwal: {t.alasan_luar_jadwal}
            </Typography.Text>
          )}
        </span>
      ),
    },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    { title: "Keterangan", dataIndex: "keterangan", render: (v: string) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
    { title: "Status", render: (_, t) => (t.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">tercatat</Lencana>) },
    {
      title: "Aksi",
      width: 190,
      render: (_, t) => {
        if (t.dibatalkan) return null;
        const sumber = sumberTransfer(t);
        if (sumber) return <OtomatisDari sumber={sumber} />;
        return (
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
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        judul="Kas & transaksi"
        sub="Saldo akun kas dan riwayat uang masuk/keluar. Sebagian besar tercatat otomatis dari Order, Selasa, Gaji, dan Kas kecil."
        aksi={
          <Button variant={form ? "pinggir" : "utama"} onClick={() => setForm(!form)}>
            {form ? "Tutup formulir" : <><PlusOutlined /> Catat manual</>}
          </Button>
        }
      />
      <Row gutter={[16, 16]}>
        {form && (
          <Col xs={24} lg={8}>
            <Card judul="Catat manual" sub="Hanya untuk yang jarang terjadi, mis. pemasukan lain atau prive. Yang lain dicatat dari halamannya masing-masing.">
              <FormTransaksi akun={akun} kategori={katQ.data ?? []} onSukses={() => setForm(false)} />
            </Card>
          </Col>
        )}
        <Col xs={24} lg={form ? 16 : 24}>
          <Flex vertical gap="middle">
            <Card judul="Saldo akun kas">
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
                  <Field label="Filter akun kas">
                    <Select value={akunId} onChange={(e) => setAkunId(e.target.value)}>
                      <option value="">Semua akun kas</option>
                      {akun.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nama}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </Col>
              </Row>
              {akun.find((a) => a.id === akunId)?.jenis === "kas_iklan" && (
                <div style={{ marginBottom: 12 }}>
                  <KirimKeLaporan sumber="kas_iklan" />
                </div>
              )}
              <DaftarTransaksi data={trxQ.data} kategori={katQ.data ?? []} bolehBatal memuat={trxQ.isLoading} kosong="Belum ada transaksi. Tekan 'Catat transaksi' untuk mencatat pemasukan atau pengeluaran manual." />
            </Card>
            <Card judul="Riwayat transfer antar akun kas">
              <ErrorBox error={transferQ.error ?? aksi.error} />
              <DataTabel kolom={kolomTransfer} data={transferQ.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada transfer. Tarik saldo dan isi ulang kas dicatat dari Tutup Kas Mingguan." />
            </Card>
          </Flex>
        </Col>
      </Row>
    </>
  );
}
