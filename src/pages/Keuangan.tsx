import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Baris, Button, Card, ErrorBox, Field, Memuat, Select } from "../components/ui";
import { api, query } from "../lib/api";
import { rp } from "../lib/format";
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

  return (
    <>
      <h1 className="text-lg font-bold">Keuangan</h1>
      <Card judul="Saldo akun">
        {akun.map((a) => (
          <Baris key={a.id} kiri={a.nama} kanan={rp(a.saldo)} />
        ))}
      </Card>

      <Button className="w-full" variant={form ? "pinggir" : "utama"} onClick={() => setForm(!form)}>
        {form ? "Tutup formulir" : "+ Catat transaksi"}
      </Button>
      {form && (
        <Card judul="Transaksi baru">
          <FormTransaksi akun={akun} kategori={katQ.data ?? []} onSukses={() => setForm(false)} />
        </Card>
      )}

      <Card judul="Riwayat transaksi">
        <div className="mb-3">
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
    </>
  );
}
