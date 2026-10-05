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

type Order = { id: string; no_order: string; catatan: string; nama_pembeli: string; produk_id: string; status: string; butuh_cat: boolean };
type Produk = { id: string; nama: string; sku: string; jenis_produk: string; ukuran: string };
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
  const produk = useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/baru/jenis") });
  const peta = new Map((produk.data ?? []).map((p) => [p.id, p]));
  return (
    <Bingkai anak={
      <>
        <Judul judul="Order" sub="Dari ERP, reseller, dan input manual. Nama yang beda tidak digabung otomatis." />
        <a className="text-sm text-emerald-800" href="/order/peta">Petakan barang</a>
        <ul className="mt-4 divide-y rounded-2xl bg-white">
          {(order.data ?? []).slice(0, 40).map((o) => {
            const p = peta.get(o.produk_id);
            const belum = p?.sku === "ERP-BELUM";
            return (
              <li key={o.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{belum ? o.catatan || "Belum dipetakan" : p?.nama}</span>
                <span className="ml-2 text-stone-500">{o.no_order} · {o.nama_pembeli} · {belum ? "menunggu jenis" : p?.jenis_produk === "kayu" ? "kayu" : "non-kayu"}</span>
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["belum-peta"] }),
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
                {jenis.map((p) => <option key={p.id} value={p.id}>{p.nama} · {p.jenis_produk === "kayu" ? "kayu" : "non-kayu"}</option>)}
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
  const produk = useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/baru/jenis") });
  const peta = new Map((produk.data ?? []).map((p) => [p.id, p]));
  const kayu = (order.data ?? []).filter((o) => peta.get(o.produk_id)?.jenis_produk === "kayu" && o.butuh_cat);
  const non = (order.data ?? []).filter((o) => peta.get(o.produk_id)?.jenis_produk === "non_kayu");
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
  const tarik = useMutation({ mutationFn: () => api("/baru/tarik?hari=30", { method: "POST" }) });
  return (
    <Bingkai anak={
      <>
        <Judul judul="Keuangan" sub="Pencairan Shopee dari ERP. Toko web dan marketplace lain tetap manual. Iklan dan kas dari modal." />
        <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white" onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik order 30 hari dari ERP"}</button>
        <p className="mt-3 text-sm text-stone-600">Gaji dicadangkan tiap minggu, dibayar minggu keempat. Bagi hasil 40/60 setelah gaji.</p>
      </>
    } />
  );
}

function Pengaturan() {
  const produk = useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/baru/jenis") });
  return (
    <Bingkai anak={
      <>
        <Judul judul="Pengaturan" sub="Jenis katalog, bukan listing Shopee. Harga reseller per jenis." />
        <ul className="divide-y rounded-2xl bg-white">
          {(produk.data ?? []).filter((p) => p.sku !== "ERP-BELUM").map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm">{p.nama} · {p.jenis_produk === "kayu" ? "kayu" : "non-kayu, tanpa cat"} {p.ukuran}</li>
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
      <Route path="/baru/peta" element={<Peta />} />
      <Route path="/produksi" element={<Produksi />} />
      <Route path="/keuangan" element={<Keuangan />} />
      <Route path="/pengaturan" element={<Pengaturan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
