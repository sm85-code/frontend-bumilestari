import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Hammer, Landmark, LayoutDashboard, Settings } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import Masuk from "../pages/Masuk";

const menu = [
  { ke: "/", label: "Dashboard", ikon: LayoutDashboard },
  { ke: "/order", label: "Order", ikon: ClipboardList },
  { ke: "/produksi", label: "Produksi", ikon: Hammer },
  { ke: "/keuangan", label: "Keuangan", ikon: Landmark },
  { ke: "/pengaturan", label: "Pengaturan", ikon: Settings },
];

type Order = { id: string; no_order: string; nama_barang?: string; catatan?: string; pembeli?: string; nama_pembeli?: string; produk_id?: string; jenis?: string; kayu?: boolean; status: string; toko?: string };
type Produk = { id: string; nama: string; sku?: string; jenis_produk?: string; kayu?: boolean; ukuran: string; harga_reseller?: number; produk_id?: string };
type Belum = { nama: string; jumlah: number };

function Bingkai({ anak }: { anak: React.ReactNode }) {
  const { user, keluar } = useAuth();
  return (
    <div className="min-h-screen">
      <aside aria-label="Menu samping" className="fixed inset-y-0 left-0 hidden w-56 border-r border-emerald-900/10 bg-white p-4 md:block">
        <p className="px-2 text-sm font-semibold text-emerald-900">Bumi Lestari</p>
        <p className="px-2 text-xs text-stone-500">{user?.nama}</p>
        <nav aria-label="Navigasi utama" className="mt-6 space-y-1">
          {menu.map((m) => (
            <NavLink key={m.ke} to={m.ke} end={m.ke === "/"} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-emerald-800 text-white" : "text-stone-700 hover:bg-emerald-50"}`}>
              <m.ikon size={16} /> {m.label}
            </NavLink>
          ))}
        </nav>
        <button className="mt-6 px-3 text-sm text-stone-500" onClick={() => void keluar()}>Keluar</button>
      </aside>
      <main className="px-4 py-6 pb-24 md:ml-56">{anak}</main>
      <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-white md:hidden">
        {menu.map((m) => (
          <NavLink key={m.ke} to={m.ke} end={m.ke === "/"} className={({ isActive }) => `flex flex-col items-center py-2 text-[11px] ${isActive ? "text-emerald-800" : "text-stone-500"}`}>
            <m.ikon size={16} /> {m.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Judul({ judul, sub }: { judul: string; sub: string }) {
  return <header className="mb-4"><h1 className="text-2xl font-semibold">{judul}</h1><p className="mt-1 text-sm text-stone-600">{sub}</p></header>;
}

function Dashboard() {
  const belum = useQuery({ queryKey: ["belum-peta"], queryFn: () => api<Belum[]>("/baru/belum-peta") });
  const n = (belum.data ?? []).reduce((a, b) => a + b.jumlah, 0);
  return (
    <Bingkai anak={
      <>
        <Judul judul="Dashboard" sub="Senin–Sabtu dihitung. Cut-off Selasa. Laba kotor dulu, gaji minggu keempat, bagi hasil 40/60 setelah gaji." />
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-medium">Belum dipetakan</h2>
          <p className="mt-1 text-3xl font-semibold text-emerald-900">{n}</p>
          <a className="text-sm text-emerald-800" href="/order">Buka order</a>
        </section>
      </>
    } />
  );
}

function OrderBaru() {
  const order = useQuery({ queryKey: ["order"], queryFn: () => api<Order[]>("/baru/order") });
  return (
    <Bingkai anak={
      <>
        <Judul judul="Order" sub="Dari ERP, reseller, dan input manual. Nama yang beda tidak digabung otomatis." />
        <a className="text-sm text-emerald-800" href="/order/peta">Petakan barang</a>
        <ul className="mt-4 divide-y rounded-2xl bg-white">
          {(order.data ?? []).map((o) => {
            return (
              <li key={o.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{o.nama_barang || o.catatan || "Tanpa nama produk"}</span>
                <span className="ml-2 text-stone-500">{o.no_order} · {o.toko} · {o.pembeli || o.nama_pembeli} · {o.jenis ? (o.kayu ? "kayu" : "non-kayu") : "belum dipetakan"}</span>
              </li>
            );
          })}
        </ul>
      </>
    } />
  );
}

function Peta() {
  const qc = useQueryClient();
  const [pilih, setPilih] = useState<Record<string, string>>({});
  const belum = useQuery({ queryKey: ["belum-peta"], queryFn: () => api<Belum[]>("/baru/belum-peta") });
  const produk = useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/baru/jenis") });
  const simpan = useMutation({
    mutationFn: (body: { nama: string; jenis_id: string }) => api("/baru/peta", { method: "POST", body }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["belum-peta"] }); void qc.invalidateQueries({ queryKey: ["order"] }); },
  });
  const jenis = (produk.data ?? []).filter((p) => p.sku !== "ERP-BELUM");
  return (
    <Bingkai anak={
      <>
        <Judul judul="Petakan barang" sub="Cocokkan nama Shopee ke jenis. Non-kayu tidak dicat." />
        <ul className="space-y-3">
          {(belum.data ?? []).map((b) => (
            <li key={b.nama} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 text-sm">
              <span className="min-w-48 font-medium">{b.nama}</span>
              <span className="text-stone-500">{b.jumlah} order</span>
              <select className="rounded-lg border px-2 py-1" value={pilih[b.nama] ?? ""} onChange={(e) => setPilih((s) => ({ ...s, [b.nama]: e.target.value }))}>
                <option value="">Pilih jenis</option>
                {jenis.map((p) => <option key={p.id} value={p.id}>{p.nama} · {p.kayu ? "kayu, perlu cat" : "non-kayu, tanpa cat"} {p.ukuran}</option>)}
              </select>
              <button className="rounded-lg bg-emerald-800 px-3 py-1 text-white" disabled={!pilih[b.nama]} onClick={() => simpan.mutate({ nama: b.nama, jenis_id: pilih[b.nama] })}>Simpan</button>
            </li>
          ))}
        </ul>
      </>
    } />
  );
}

function Produksi() {
  const order = useQuery({ queryKey: ["order"], queryFn: () => api<Order[]>("/baru/order") });
  const kayu = (order.data ?? []).filter((o) => o.kayu);
  const non = (order.data ?? []).filter((o) => o.jenis && !o.kayu);
  return (
    <Bingkai anak={
      <>
        <Judul judul="Produksi" sub="Status di sini tidak dikirim ke Shopee." />
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-4"><h2 className="font-medium">Kayu, antrian cat</h2><p className="text-sm text-stone-600">{kayu.length} order. Setelah tukang selesai.</p></section>
          <section className="rounded-2xl bg-white p-4"><h2 className="font-medium">Non-kayu</h2><p className="text-sm text-stone-600">{non.length} order. Dari supplier, tanpa cat. Karyawan non-kayu yang packing.</p></section>
        </div>
      </>
    } />
  );
}

function Keuangan() {
  const tarik = useMutation({ mutationFn: () => api<{ order: number }>("/baru/tarik?hari=30", { method: "POST" }) });
  return (
    <Bingkai anak={
      <>
        <Judul judul="Keuangan" sub="Pencairan Shopee dari ERP. Toko web dan marketplace lain tetap manual. Iklan dan kas dari modal." />
        <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white" onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik order 30 hari dari ERP"}</button>
        {tarik.data ? <p className="mt-3 text-sm">{tarik.data.order} order baru masuk.</p> : null}
        {tarik.isError ? <p className="mt-3 text-sm text-red-700">{tarik.error instanceof Error ? tarik.error.message : "Tarik gagal"}</p> : null}
        <p className="mt-3 text-sm text-stone-600">Gaji dicadangkan tiap minggu, dibayar minggu keempat. Bagi hasil 40/60 setelah gaji.</p>
      </>
    } />
  );
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
}
function angka(teks: string) {
  return Number(teks.replace(/\D/g, "") || 0);
}
function tulisRupiah(teks: string) {
  const n = angka(teks);
  return n ? new Intl.NumberFormat("id-ID").format(n) : "";
}

type Varian = { id: string; nama: string; nilai: { id: string; nilai: string; harga_tukang?: number; custom?: boolean }[] };
type ProdukInduk = { id: string; nama: string; kayu: boolean; varian: Varian[] };

function Pengaturan() {
  const qc = useQueryClient();
  const [nama, setNama] = useState("");
  const [kayu, setKayu] = useState(true);
  const [sumbu, setSumbu] = useState<Record<string, string>>({});
  const [nilai, setNilai] = useState<Record<string, string>>({});
  const [hargaTukang, setHargaTukang] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<Record<string, boolean>>({});
  const [ubah, setUbah] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftHarga, setDraftHarga] = useState("");
  const produk = useQuery({ queryKey: ["produk-induk"], queryFn: () => api<ProdukInduk[]>("/baru/produk") });
  const jenis = useQuery({ queryKey: ["jenis"], queryFn: () => api<Produk[]>("/baru/jenis") });
  const segar = () => {
    void qc.invalidateQueries({ queryKey: ["produk-induk"] });
    void qc.invalidateQueries({ queryKey: ["produk"] });
    void qc.invalidateQueries({ queryKey: ["jenis"] });
  };
  const simpanProduk = useMutation({ mutationFn: () => api("/baru/produk", { method: "POST", body: { nama, kayu } }), onSuccess: () => { setNama(""); segar(); } });
  const simpanVarian = useMutation({ mutationFn: (produkId: string) => api("/baru/varian", { method: "POST", body: { produk_id: produkId, nama: sumbu[produkId] } }), onSuccess: () => segar() });
  const simpanNilai = useMutation({
    mutationFn: (varianId: string) => api("/baru/nilai", { method: "POST", body: { varian_id: varianId, nilai: nilai[varianId], harga_tukang: angka(hargaTukang[varianId] ?? ""), custom: Boolean(custom[varianId]) } }),
    onSuccess: () => segar(),
  });
  const hapus = useMutation({ mutationFn: (path: string) => api(path, { method: "DELETE" }), onSuccess: () => segar() });
  const simpanUbah = useMutation({
    mutationFn: (id: string) => api(`/baru/nilai/${id}`, { method: "PATCH", body: { nilai: draft, harga_tukang: angka(draftHarga), custom: draft === "custom" } }),
    onSuccess: () => { setUbah(null); segar(); },
  });
  return (
    <Bingkai anak={
      <>
        <Judul judul="Pengaturan" sub="Produk diketik sekali. Harga dalam rupiah, pemisah ribuan." />
        <form className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3" onSubmit={(e) => { e.preventDefault(); simpanProduk.mutate(); }}>
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Nama produk" value={nama} onChange={(e) => setNama(e.target.value)} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={kayu} onChange={(e) => setKayu(e.target.checked)} /> Kayu, perlu cat</label>
          <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white" type="submit">Simpan produk</button>
        </form>
        <ul className="mb-4 divide-y rounded-2xl bg-white">
          {(jenis.data ?? []).filter((j) => !j.produk_id).map((j) => (
            <li key={j.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{j.nama} · {j.kayu ? "kayu, perlu cat" : "non-kayu, tanpa cat"} {j.ukuran}</span>
              <button className="text-red-700" onClick={() => hapus.mutate(`/baru/jenis/${j.id}`)}>Hapus</button>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {(produk.data ?? []).map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{p.nama} · {p.kayu ? "kayu, perlu cat" : "non-kayu, tanpa cat"}</p>
                <button className="text-red-700" onClick={() => hapus.mutate(`/baru/produk/${p.id}`)}>Hapus</button>
              </div>
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); simpanVarian.mutate(p.id); }}>
                <input className="rounded-lg border px-3 py-1" placeholder="Nama varian, misalnya ukuran" value={sumbu[p.id] ?? ""} onChange={(e) => setSumbu((s) => ({ ...s, [p.id]: e.target.value }))} required />
                <button className="rounded-lg border px-3 py-1" type="submit">Tambah varian</button>
              </form>
              {p.varian.map((v) => (
                <div key={v.id} className="mt-3">
                  <div className="flex items-center justify-between text-stone-600"><span>{v.nama}</span><button className="text-red-700" onClick={() => hapus.mutate(`/baru/varian/${v.id}`)}>Hapus varian</button></div>
                  <ul className="mt-1 space-y-1">
                    {v.nilai.map((n) => (
                      <li key={n.id} className="flex flex-wrap items-center gap-2">
                        {ubah === n.id ? (
                          <>
                            <input className="rounded-lg border px-2 py-1" value={draft} onChange={(e) => setDraft(e.target.value)} />
                            <input className="rounded-lg border px-2 py-1" inputMode="numeric" value={draftHarga} onChange={(e) => setDraftHarga(tulisRupiah(e.target.value))} />
                            <button className="rounded-lg border px-2 py-1" onClick={() => simpanUbah.mutate(n.id)}>Simpan</button>
                          </>
                        ) : (
                          <span>{n.nilai} · {n.custom ? "custom, harga di order" : rupiah(n.harga_tukang ?? 0)}</span>
                        )}
                        <button className="text-emerald-800" onClick={() => { setUbah(n.id); setDraft(n.nilai); setDraftHarga(n.harga_tukang ? tulisRupiah(String(n.harga_tukang)) : ""); }}>Ubah</button>
                        <button className="text-red-700" onClick={() => hapus.mutate(`/baru/nilai/${n.id}`)}>Hapus</button>
                      </li>
                    ))}
                  </ul>
                  <form className="mt-1 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); simpanNilai.mutate(v.id); }}>
                    <input className="rounded-lg border px-3 py-1" placeholder="Nilai, misalnya 50 x 20 x 200" value={nilai[v.id] ?? ""} onChange={(e) => setNilai((s) => ({ ...s, [v.id]: e.target.value }))} required />
                    <input className="rounded-lg border px-3 py-1" placeholder="Harga tukang" inputMode="numeric" value={hargaTukang[v.id] ?? ""} disabled={Boolean(custom[v.id])} onChange={(e) => setHargaTukang((s) => ({ ...s, [v.id]: tulisRupiah(e.target.value) }))} />
                    <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(custom[v.id])} onChange={(e) => setCustom((s) => ({ ...s, [v.id]: e.target.checked }))} /> Custom</label>
                    <button className="rounded-lg border px-3 py-1" type="submit">Tambah nilai</button>
                  </form>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </>
    } />
  );
}

export default function AppBaru() {
  const { user, memuat } = useAuth();
  if (memuat) return null;
  if (!user) return <Routes><Route path="*" element={<Masuk />} /></Routes>;
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/order" element={<OrderBaru />} />
      <Route path="/order/peta" element={<Peta />} />
      <Route path="/produksi" element={<Produksi />} />
      <Route path="/keuangan" element={<Keuangan />} />
      <Route path="/pengaturan" element={<Pengaturan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
