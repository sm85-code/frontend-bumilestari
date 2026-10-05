import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Hammer, Landmark, LayoutDashboard, Settings } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
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

function Dashboard() {
  return (
    <Bingkai anak={
      <>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-600">Senin–Sabtu dihitung. Cut-off Selasa. Laba kotor dulu, gaji di minggu keempat, bagi hasil 40/60 setelah gaji.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Kotak judul="Belum dipetakan" isi="Order ERP yang namanya belum jadi jenis katalog." />
          <Kotak judul="Kayu" isi="Tukang, lalu karyawan cat." />
          <Kotak judul="Non-kayu" isi="Supplier, tanpa cat. Karyawan non-kayu yang packing." />
        </div>
      </>
    } />
  );
}

function Kotak({ judul, isi }: { judul: string; isi: string }) {
  return <section className="rounded-2xl bg-white p-4 shadow-sm"><h2 className="font-medium">{judul}</h2><p className="mt-1 text-sm text-stone-600">{isi}</p></section>;
}

function OrderBaru() {
  const q = useQuery({ queryKey: ["order"], queryFn: () => api<Array<{ id: string; no_order: string; catatan: string; nama_pembeli: string }>>("/order") });
  return (
    <Bingkai anak={
      <>
        <h1 className="text-2xl font-semibold">Order</h1>
        <p className="mt-1 text-sm text-stone-600">Dari ERP, reseller, dan input manual. Nama Shopee dipetakan ke jenis, tidak ditebak.</p>
        <a className="mt-3 inline-block text-sm text-emerald-800" href="/order/peta">Petakan barang</a>
        <ul className="mt-4 divide-y rounded-2xl bg-white">
          {(q.data ?? []).slice(0, 30).map((o) => (
            <li key={o.id} className="px-4 py-3 text-sm">
              <span className="font-medium">{o.catatan || o.no_order}</span>
              <span className="ml-2 text-stone-500">{o.no_order} · {o.nama_pembeli}</span>
            </li>
          ))}
        </ul>
      </>
    } />
  );
}

function Produksi() {
  return <Bingkai anak={<><h1 className="text-2xl font-semibold">Produksi</h1><p className="mt-2 text-sm text-stone-600">Kayu: tukang lalu karyawan cat. Non-kayu: supplier, tanpa cat. Status di sini tidak dikirim ke Shopee.</p></>} />;
}

function Keuangan() {
  return <Bingkai anak={<><h1 className="text-2xl font-semibold">Keuangan</h1><p className="mt-2 text-sm text-stone-600">Pencairan Shopee dari ERP. Toko web dan marketplace lain manual. Iklan dan kas dari modal. Gaji dicadangkan tiap minggu, dibayar minggu keempat. Bagi hasil setelah itu.</p><a className="mt-3 inline-block text-sm text-emerald-800" href="/pencairan/erp">Tarik dari ERP</a></>} />;
}

function Pengaturan() {
  return <Bingkai anak={<><h1 className="text-2xl font-semibold">Pengaturan</h1><p className="mt-2 text-sm text-stone-600">Katalog jenis, harga reseller, tukang, supplier, dan enam toko yang masuk laporan.</p></>} />;
}

export default function AppBaru() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Routes><Route path="*" element={<Masuk />} /></Routes>;
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/order" element={<OrderBaru />} />
      <Route path="/produksi" element={<Produksi />} />
      <Route path="/keuangan" element={<Keuangan />} />
      <Route path="/pengaturan" element={<Pengaturan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
