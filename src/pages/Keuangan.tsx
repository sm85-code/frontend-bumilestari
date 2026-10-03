import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Memuat, PageHeader, Select } from "../components/ui";
import { api, query } from "../lib/api";
import { num, rp } from "../lib/format";
import type { AkunKas, Kategori, Transaksi } from "../lib/types";

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

  const JENIS: Record<string, string> = { kas: "Kas", bank: "Bank", ewallet: "E-wallet", kas_kecil: "Kas kecil", kas_iklan: "Kas iklan" };
  const total = akun.reduce((t, a) => t + num(a.saldo), 0);
  const kolomAkun: TableColumnsType<AkunKas> = [
    { title: "Akun", dataIndex: "nama" },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => <span className="text-coklat">{JENIS[v] ?? v}</span> },
    { title: "Saldo", dataIndex: "saldo", align: "right", render: (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span> },
  ];

  return (
    <>
      <PageHeader judul="Keuangan" />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="space-y-4">
          <Button className="w-full" variant={form ? "pinggir" : "utama"} onClick={() => setForm(!form)}>
            {form ? "Tutup formulir" : <><PlusOutlined /> Catat transaksi</>}
          </Button>
          {form && (
            <Card judul="Transaksi baru">
              <FormTransaksi akun={akun} kategori={katQ.data ?? []} onSukses={() => setForm(false)} />
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4">
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
            <div className="mb-3 max-w-xs">
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
            </div>
            <DaftarTransaksi data={trxQ.data} kategori={katQ.data ?? []} bolehBatal memuat={trxQ.isLoading} />
          </Card>
        </div>
      </div>
    </>
  );
}
