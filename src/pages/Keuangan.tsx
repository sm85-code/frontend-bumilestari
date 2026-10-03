import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Button, Card, ErrorBox, Field, Memuat, Select, Tabel, Td, TdTotal, Th } from "../components/ui";
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

  return (
    <>
      <h1 className="text-lg font-bold">Keuangan</h1>
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="space-y-4">
          <Button className="w-full" variant={form ? "pinggir" : "utama"} onClick={() => setForm(!form)}>
            {form ? "Tutup formulir" : "+ Catat transaksi"}
          </Button>
          {form && (
            <Card judul="Transaksi baru">
              <FormTransaksi akun={akun} kategori={katQ.data ?? []} onSukses={() => setForm(false)} />
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <Card judul="Saldo akun">
            <Tabel minLebar={360}>
              <thead>
                <tr>
                  <Th lengket>Akun</Th>
                  <Th>Jenis</Th>
                  <Th kanan>Saldo</Th>
                </tr>
              </thead>
              <tbody>
                {akun.map((a) => (
                  <tr key={a.id}>
                    <Td lengket>{a.nama}</Td>
                    <Td className="text-stone-600">{JENIS[a.jenis] ?? a.jenis}</Td>
                    <Td kanan>{rp(a.saldo)}</Td>
                  </tr>
                ))}
                <tr>
                  <TdTotal lengket colSpan={2}>Total</TdTotal>
                  <TdTotal kanan>{rp(total)}</TdTotal>
                </tr>
              </tbody>
            </Tabel>
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
