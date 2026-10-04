import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button, Card, ErrorBox, Memuat, PageHeader, Select } from "../components/ui";

type Toko = { id: string; nama: string; shop_id: string; masuk: boolean };
type Saluran = { id: string; nama: string; jenis?: string; akun_erp_id?: string | null };

export default function PencairanErpPage() {
  const toko = useQuery({ queryKey: ["erp-toko"], queryFn: () => api<Toko[]>("/pencairan/erp/toko") });
  const saluran = useQuery({ queryKey: ["saluran"], queryFn: () => api<Saluran[]>("/saluran") });
  const [peta, setPeta] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<Record<string, string>>({});
  const [sibuk, setSibuk] = useState("");
  const pasang = useMutation({
    mutationFn: (body: { saluran_id: string; akun_erp_id: string }) => api("/pencairan/erp/pasang", { method: "POST", body }),
  });
  const tarik = useMutation({
    mutationFn: () => api<{ saluran: { saluran: string; baris: number; catatan?: string }[] }>("/pencairan/erp/tarik?hari=15", { method: "POST" }),
  });
  const order = useMutation({
    mutationFn: () => api<{ order: number }>("/pencairan/erp/order?hari=30", { method: "POST" }),
  });

  if (toko.isLoading || saluran.isLoading) return <Memuat />;
  const masuk = (toko.data ?? []).filter((t) => t.masuk || (t.nama.toLowerCase().includes("azfa furniture") && !t.nama.toLowerCase().includes("digital")));
  const pilihan = (saluran.data ?? []).filter((s) => s.jenis !== "reseller");
  return (
    <>
      <PageHeader judul="Pencairan dari ERP" sub="Satu toko Shopee dipasangkan ke satu saluran. Hasil tarikan masih draf." aksi={<Link to="/pencairan">Kembali</Link>} />
      <ErrorBox error={toko.error ?? saluran.error ?? pasang.error ?? tarik.error ?? order.error} />
      <Card judul="Pasangkan toko">
        {masuk.length < 6 && <p>AZFA Furniture Official belum muncul. Muat ulang setelah backend terbaru.</p>}
        {masuk.map((t) => (
          <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ minWidth: 200 }}>{t.nama}</span>
            <Select aria-label={t.nama} value={peta[t.id] ?? ""} placeholder="Pilih saluran" onChange={(e) => setPeta((p) => ({ ...p, [t.id]: e.target.value }))}>
              {pilihan.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </Select>
            <Button
              disabled={!peta[t.id] || sibuk === t.id}
              onClick={() => {
                setSibuk(t.id);
                pasang.mutate(
                  { saluran_id: peta[t.id], akun_erp_id: t.id },
                  { onSuccess: () => setPesan((p) => ({ ...p, [t.id]: "Tersimpan" })), onSettled: () => setSibuk("") },
                );
              }}
            >
              {sibuk === t.id ? "Menyimpan…" : "Simpan"}
            </Button>
            {pesan[t.id] && <span>{pesan[t.id]}</span>}
          </div>
        ))}
        {pilihan.length < 2 && <p>Saluran yang ada baru satu. Buat saluran per toko di Data master supaya tidak tercampur.</p>}
      </Card>
      <Card judul="Tarik dari ERP">
        <Button disabled={order.isPending} onClick={() => order.mutate()}>{order.isPending ? "Menarik order…" : "Tarik order"}</Button>
        {order.data && <p>{order.data.order} order baru.</p>}
        <Button disabled={tarik.isPending} onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik pencairan 15 hari"}</Button>
        {tarik.data && <ul>{tarik.data.saluran.map((s) => <li key={s.saluran}>{s.saluran}: {s.baris} baris{s.catatan ? ` (${s.catatan})` : ""}</li>)}</ul>}
      </Card>
    </>
  );
}
