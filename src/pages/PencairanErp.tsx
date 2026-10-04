import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, ErrorBox, Memuat, PageHeader, Select } from "../components/ui";

type Toko = { id: string; nama: string; shop_id: string; masuk: boolean };
type Saluran = { id: string; nama: string; akun_erp_id?: string | null };

export default function PencairanErpPage() {
  const qc = useQueryClient();
  const toko = useQuery({ queryKey: ["erp-toko"], queryFn: () => api<Toko[]>("/pencairan/erp/toko") });
  const saluran = useQuery({ queryKey: ["saluran"], queryFn: () => api<Saluran[]>("/saluran") });
  const [peta, setPeta] = useState<Record<string, string>>({});
  const pasang = useMutation({
    mutationFn: (body: { saluran_id: string; akun_erp_id: string }) => api("/pencairan/erp/pasang", { method: "POST", body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["saluran"] }),
  });
  const tarik = useMutation({
    mutationFn: () => api<{ saluran: { saluran: string; baris: number; catatan?: string }[] }>("/pencairan/erp/tarik?hari=15", { method: "POST" }),
  });

  if (toko.isLoading || saluran.isLoading) return <Memuat />;
  const masuk = (toko.data ?? []).filter((t) => t.masuk);
  return (
    <>
      <PageHeader judul="Pencairan dari ERP" sub="Toko Shopee yang masuk Bumi Lestari. Hasilnya draf, belum ke laporan." aksi={<Link to="/pencairan">Kembali</Link>} />
      <ErrorBox error={toko.error ?? saluran.error ?? pasang.error ?? tarik.error} />
      <Card judul="Pasangkan toko">
        {masuk.map((t) => (
          <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ minWidth: 220 }}>{t.nama}</span>
            <Select aria-label={t.nama} value={peta[t.id] ?? ""} onChange={(e) => setPeta((p) => ({ ...p, [t.id]: e.target.value }))}>
              <option value="">Pilih saluran</option>
              {(saluran.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </Select>
            <Button disabled={!peta[t.id] || pasang.isPending} onClick={() => pasang.mutate({ saluran_id: peta[t.id], akun_erp_id: t.id })}>Simpan</Button>
          </div>
        ))}
      </Card>
      <Card judul="Tarik pencairan">
        <Button disabled={tarik.isPending} onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik 15 hari"}</Button>
        {tarik.data && <ul>{tarik.data.saluran.map((s) => <li key={s.saluran}>{s.saluran}: {s.baris} baris{s.catatan ? ` (${s.catatan})` : ""}</li>)}</ul>}
      </Card>
    </>
  );
}
