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

type Order = { id: string; no_order: string; nama_barang?: string; varian?: string; qty?: number; keterangan?: string; tgl_pesan?: string; status_peta?: string; jenis_pesanan?: string; catatan?: string; pembeli?: string; nama_pembeli?: string; produk_id?: string; jenis?: string; kayu?: boolean; status: string; toko?: string; sumber?: string };
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
          <Uji />
        </section>
      </>
    } />
  );
}

function sumberLabel(s?: string) {
  if (s === "erp") return "ERP";
  if (s === "reseller") return "Reseller";
  if (s === "web") return "Toko web";
  return "Input manual";
}
function templatePesanan() {
  const isi = "tgl_pesan,toko,nama_barang,varian,qty,keterangan,sumber\n2026-10-06,Mandala Wangi,Partisi Rak Palang,100x20x200,1,,reseller\n";
  const blob = new Blob([isi], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "template-pesanan.csv";
  a.click();
}
function OrderBaru() {
  const qc = useQueryClient();
  const order = useQuery({ queryKey: ["order"], queryFn: () => api<Order[]>("/baru/order") });
  const pihak = useQuery({ queryKey: ["pihak"], queryFn: () => api<{ reseller: { kode: string; nama: string }[] }>("/baru/pihak") });
  const [form, setForm] = useState<"reseller" | "manual" | null>(null);
  const [kelola, setKelola] = useState<Order | null>(null);
  const [pilih, setPilih] = useState<string[]>([]);
  const [saring, setSaring] = useState("semua");
  const [toko, setToko] = useState("");
  const [kolom, setKolom] = useState("tgl");
  const [arah, setArah] = useState(1);
  const [edit, setEdit] = useState<Order | null>(null);
  const [cari, setCari] = useState("");
  const katalog = useQuery({ queryKey: ["jenis"], queryFn: () => api<Produk[]>("/baru/jenis") });
  const [isi, setIsi] = useState({ tgl_pesan: "", toko: "", nama_barang: "", varian: "", qty: "1", keterangan: "" });
  const tokoAda = [...new Set((order.data ?? []).map((o) => o.toko || "").filter(Boolean))];
  const baris = [...(order.data ?? [])].filter((o) => {
    if (saring === "belum") return !o.jenis;
    if (saring === "sudah") return Boolean(o.jenis);
    if (saring === "toko") return !toko || o.toko === toko;
    return true;
  }).sort((a, b) => {
    const nilai = (o: Order) => kolom === "tgl" ? o.tgl_pesan || "" : kolom === "toko" ? o.toko || "" : kolom === "produk" ? o.nama_barang || "" : kolom === "kode" ? o.no_order || "" : kolom === "qty" ? String(o.qty ?? 1) : o.sumber || "";
    return nilai(a).localeCompare(nilai(b)) * arah;
  });
  function urutkan(nama: string) { setKolom(nama); setArah(kolom === nama ? arah * -1 : 1); }
  const tarik = useMutation({ mutationFn: () => api("/baru/tarik?hari=15", { method: "POST" }), onSuccess: () => void qc.invalidateQueries({ queryKey: ["order"] }) });
  const simpan = useMutation({
    mutationFn: () => api("/baru/order", { method: "POST", body: { ...isi, qty: Number(isi.qty || 1), sumber: form === "reseller" ? "reseller" : "manual" } }),
    onSuccess: () => { setForm(null); void qc.invalidateQueries({ queryKey: ["order"] }); },
  });
  async function impor(file: File) {
    const teks = await file.text();
    const [kepala, ...isiFile] = teks.trim().split(/\r?\n/);
    const kolom = kepala.split(",");
    const barisFile = isiFile.filter(Boolean).map((baris) => {
      const nilai = baris.split(",");
      return Object.fromEntries(kolom.map((k, i) => [k.trim(), nilai[i] ?? ""]));
    });
    await api("/baru/order/impor", { method: "POST", body: { baris: barisFile } });
    void qc.invalidateQueries({ queryKey: ["order"] });
  }
  return (
    <Bingkai anak={
      <>
        <Judul judul="Order" sub="Dari ERP, reseller, dan input manual. Nama yang beda tidak digabung otomatis." />
        <div className="mb-3 flex flex-wrap gap-2">
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik Pesanan dari ERP"}</button>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setForm("reseller")}>Input Pesanan Reseller</button>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setForm("manual")}>Input Pesanan Manual</button>
          <label className="rounded-lg border px-3 py-2 text-sm">Import Pesanan dari Excel<input className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) void impor(f); }} /></label>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={templatePesanan}>Download Template</button>
          <select className="rounded-lg border px-3 py-2 text-sm" value={saring} onChange={(e) => setSaring(e.target.value)}>
            <option value="semua">Semua</option>
            <option value="toko">Toko</option>
            <option value="belum">Belum dipetakan</option>
            <option value="sudah">Sudah dipetakan</option>
          </select>
          {saring === "toko" ? <select className="rounded-lg border px-3 py-2 text-sm" value={toko} onChange={(e) => setToko(e.target.value)}><option value="">Semua toko</option>{tokoAda.map((n) => <option key={n}>{n}</option>)}</select> : null}
          {pilih.length ? <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => api("/baru/order/massal", { method: "POST", body: { aksi: "hapus", id: pilih } }).then(() => { setPilih([]); void qc.invalidateQueries({ queryKey: ["order"] }); })}>Hapus dipilih</button> : null}
          {pilih.length ? <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => api("/baru/order/massal", { method: "POST", body: { aksi: "jenis", jenis_pesanan: "Kayu", id: pilih } }).then(() => qc.invalidateQueries({ queryKey: ["order"] }))}>Jadikan Kayu</button> : null}
          {pilih.length ? <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => api("/baru/order/massal", { method: "POST", body: { aksi: "jenis", jenis_pesanan: "Non-Kayu", id: pilih } }).then(() => qc.invalidateQueries({ queryKey: ["order"] }))}>Jadikan Non-Kayu</button> : null}
        </div>
        {form ? (
          <form className="mb-3 grid gap-2 rounded-2xl bg-white p-3 text-sm md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); simpan.mutate(); }}>
            <input className="rounded-lg border px-2 py-1" type="date" value={isi.tgl_pesan} onChange={(e) => setIsi({ ...isi, tgl_pesan: e.target.value })} />
            {form === "reseller" ? (
              <select className="rounded-lg border px-2 py-1" value={isi.toko} onChange={(e) => setIsi({ ...isi, toko: e.target.value })}>
                <option value="">Pilih reseller</option>
                {(pihak.data?.reseller ?? []).map((r) => <option key={r.kode} value={r.nama}>{r.kode} {r.nama}</option>)}
              </select>
            ) : <input className="rounded-lg border px-2 py-1" placeholder="Nama toko" value={isi.toko} onChange={(e) => setIsi({ ...isi, toko: e.target.value })} />}
            <input className="rounded-lg border px-2 py-1" placeholder="Nama produk" value={isi.nama_barang} onChange={(e) => setIsi({ ...isi, nama_barang: e.target.value })} />
            <input className="rounded-lg border px-2 py-1" placeholder="Varian" value={isi.varian} onChange={(e) => setIsi({ ...isi, varian: e.target.value })} />
            <input className="rounded-lg border px-2 py-1" placeholder="Qty" value={isi.qty} onChange={(e) => setIsi({ ...isi, qty: e.target.value })} />
            <input className="rounded-lg border px-2 py-1" placeholder="Keterangan" value={isi.keterangan} onChange={(e) => setIsi({ ...isi, keterangan: e.target.value })} />
            <button className="rounded-lg bg-emerald-800 px-3 py-2 text-white">Simpan</button>
          </form>
        ) : null}
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" checked={baris.length > 0 && pilih.length === baris.length} onChange={(e) => setPilih(e.target.checked ? baris.map((o) => o.id) : [])} /></th>
                {[["No.", ""], ["Jenis Pesanan", "jenis"], ["Tgl Pesanan", "tgl"], ["Kode Pesanan", "kode"], ["Nama Toko/Reseller", "toko"], ["Nama Produk", "produk"], ["Varian", "varian"], ["Qty", "qty"], ["Status Pemetaan", "status"], ["Sumber Pesanan", "sumber"], ["", ""]].map(([h, k]) => <th key={h || "aksi"} className="px-3 py-2 font-medium">{k ? <button onClick={() => urutkan(k)}>{h}</button> : h}</th>)}
              </tr>
            </thead>
            <tbody>
              {baris.map((o, i) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2"><input type="checkbox" checked={pilih.includes(o.id)} onChange={(e) => setPilih(e.target.checked ? [...pilih, o.id] : pilih.filter((id) => id !== o.id))} /></td>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <select className="rounded-lg border px-2 py-1" value={o.jenis_pesanan || ""} onChange={(e) => api(`/baru/order/${o.id}/jenis`, { method: "PATCH", body: { jenis_pesanan: e.target.value } }).then(() => qc.invalidateQueries({ queryKey: ["order"] }))}>
                      <option value="">Pilih</option>
                      <option>Kayu</option>
                      <option>Non-Kayu</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{o.tgl_pesan || "-"}</td>
                  <td className="px-3 py-2">{o.no_order || "-"}</td>
                  <td className="px-3 py-2">{o.toko || o.pembeli || "-"}</td>
                  <td className="px-3 py-2">{o.nama_barang || o.catatan || "-"}</td>
                  <td className="px-3 py-2">{o.varian || "-"}</td>
                  <td className="px-3 py-2">{o.qty ?? 1}</td>
                  <td className="px-3 py-2">
                    <div>{o.status_peta || (o.jenis ? "Sudah" : "Belum")}</div>
                    {o.jenis_pesanan ? <button className="mt-1 rounded-lg bg-emerald-800 px-2 py-1 text-white" onClick={() => { setKelola(o); setCari(""); }}>Kelola Pesanan</button> : null}
                  </td>
                  <td className="px-3 py-2">{sumberLabel(o.sumber)}</td>
                  <td className="px-3 py-2">{o.sumber !== "erp" ? <><button className="mr-2" onClick={() => setEdit(o)}>Ubah</button><button className="text-red-700" onClick={() => api(`/baru/order/${o.id}`, { method: "DELETE" }).then(() => qc.invalidateQueries({ queryKey: ["order"] }))}>Hapus</button></> : null}</td>
                </tr>
              ))}
              {baris.length === 0 ? <tr><td className="px-3 py-4 text-stone-500" colSpan={12}>Belum ada order.</td></tr> : null}
            </tbody>
          </table>
        </div>
        {edit ? <form className="mb-3 grid gap-2 rounded-2xl bg-white p-3 text-sm md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); api(`/baru/order/${edit.id}`, { method: "PATCH", body: edit }).then(() => { setEdit(null); void qc.invalidateQueries({ queryKey: ["order"] }); }); }}><input className="rounded-lg border px-2 py-1" value={edit.no_order} onChange={(e) => setEdit({ ...edit, no_order: e.target.value })} /><input className="rounded-lg border px-2 py-1" value={edit.tgl_pesan || ""} onChange={(e) => setEdit({ ...edit, tgl_pesan: e.target.value })} /><input className="rounded-lg border px-2 py-1" value={edit.toko || ""} onChange={(e) => setEdit({ ...edit, toko: e.target.value })} /><input className="rounded-lg border px-2 py-1" value={edit.nama_barang || ""} onChange={(e) => setEdit({ ...edit, nama_barang: e.target.value })} /><input className="rounded-lg border px-2 py-1" value={edit.varian || ""} onChange={(e) => setEdit({ ...edit, varian: e.target.value })} /><button className="rounded-lg bg-emerald-800 px-3 py-2 text-white">Simpan ubah</button></form> : null}
        {kelola ? (
          <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-3 md:items-center" onClick={() => setKelola(null)}>
            <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-medium">Kelola Pesanan</h2>
              <p className="mt-1 text-sm text-stone-600">{kelola.nama_barang} · {kelola.jenis_pesanan}</p>
              <input className="mt-3 w-full rounded-lg border px-2 py-1" placeholder="Cari produk" value={cari} onChange={(e) => setCari(e.target.value)} />
              <div className="mt-2 max-h-64 overflow-auto rounded-lg border">
                {(katalog.data ?? []).filter((p) => (kelola.jenis_pesanan === "Kayu" ? p.kayu : !p.kayu) && `${p.nama} ${p.ukuran}`.toLowerCase().includes(cari.toLowerCase())).map((p) => (
                  <button key={p.id} className="block w-full px-2 py-1 text-left hover:bg-emerald-50" onClick={() => api("/baru/peta", { method: "POST", body: { nama: kelola.nama_barang, jenis_id: p.id } }).then(() => { setKelola(null); void qc.invalidateQueries({ queryKey: ["order"] }); })}>
                    {p.nama} · {p.ukuran}
                  </button>
                ))}
              </div>
              <button className="mt-3 rounded-lg border px-3 py-1" onClick={() => setKelola(null)}>Tutup</button>
            </div>
          </div>
        ) : null}
      </>
    } />
  );
}

function Peta() {
  const qc = useQueryClient();
  const [pilih, setPilih] = useState<Record<string, string>>({});
  const [cari, setCari] = useState<Record<string, string>>({});
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
        <Judul judul="Petakan barang" sub="Kosongkan cari untuk semua produk. Ketik hanya jika ingin menyaring." />
        <ul className="space-y-3">
          {(belum.data ?? []).map((b) => {
            const kata = (cari[b.nama] ?? "").trim().toLowerCase();
            const cocok = jenis.filter((p) => `${p.nama} ${p.ukuran}`.toLowerCase().includes(kata));
            return (
              <li key={b.nama} className="rounded-2xl bg-white p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-48 font-medium">{b.nama}</span>
                  <span className="text-stone-500">{b.jumlah} order</span>
                </div>
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  <input className="rounded-lg border px-2 py-1" placeholder="Cari, kosong = semua produk" value={cari[b.nama] ?? ""} onChange={(e) => setCari((s) => ({ ...s, [b.nama]: e.target.value }))} />
                  <div className="flex max-h-64 min-w-64 flex-col overflow-auto rounded-lg border">
                    {cocok.map((p) => (
                      <button key={p.id} className={`px-2 py-1 text-left ${pilih[b.nama] === p.id ? "bg-emerald-800 text-white" : ""}`} onClick={() => setPilih((s) => ({ ...s, [b.nama]: p.id }))}>
                        {p.nama} · {p.kayu ? "kayu" : "non-kayu"} {p.ukuran}
                      </button>
                    ))}
                    {cocok.length === 0 ? <span className="px-2 py-1 text-stone-500">Tidak ketemu</span> : null}
                  </div>
                  <button className="rounded-lg bg-emerald-800 px-3 py-1 text-white" disabled={!pilih[b.nama]} onClick={() => simpan.mutate({ nama: b.nama, jenis_id: pilih[b.nama] })}>Simpan</button>
                </div>
              </li>
            );
          })}
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
        <a className="text-sm text-emerald-800" href="/order/peta">Petakan yang belum</a>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-4"><h2 className="font-medium">Kayu, antrian cat</h2><p className="text-sm text-stone-600">{kayu.length} order. Setelah tukang selesai.</p>{kayu.map((o) => <p key={o.id} className="mt-2 text-sm">{o.nama_barang} · {o.no_order}</p>)}</section>
          <section className="rounded-2xl bg-white p-4"><h2 className="font-medium">Non-kayu</h2><p className="text-sm text-stone-600">{non.length} order. Dari supplier, tanpa cat.</p>{non.map((o) => <p key={o.id} className="mt-2 text-sm">{o.nama_barang} · {o.no_order}</p>)}</section>
        </div>
      </>
    } />
  );
}

function Keuangan() {
  const qc = useQueryClient();
  const laporan = useQuery({ queryKey: ["laporan"], queryFn: () => api<{ pendapatan: number; laba_kotor: number; kasus: { id: string; no_order: string; nama_barang: string; pembeli: string; sumber: string; pendapatan: number; barang: number; cat: number; packing: number; admin: number; proses: number; laba_kotor: number; pihak?: string; dokumen?: string; invoice?: string }[] }>("/baru/laporan") });
  const isi = useMutation({ mutationFn: () => api("/baru/uji", { method: "POST" }), onSuccess: () => void qc.invalidateQueries({ queryKey: ["laporan"] }) });
  const tarik = useMutation({ mutationFn: () => api<{ order: number }>("/baru/tarik?hari=30", { method: "POST" }), onSuccess: () => void qc.invalidateQueries({ queryKey: ["laporan"] }) });
  const uang = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
  const baris = laporan.data?.kasus ?? [];
  return (
    <Bingkai anak={
      <>
        <Judul judul="Keuangan" sub="Senin–Sabtu. Shopee dari pencairan. Reseller dari invoice. Toko web diinput manual." />
        <div className="mb-3 flex flex-wrap gap-2">
          <button className="rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white" onClick={() => isi.mutate()}>Tampilkan 3 contoh</button>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => tarik.mutate()}>{tarik.isPending ? "Menarik…" : "Tarik order Shopee"}</button>
        </div>
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-4"><p className="text-sm text-stone-500">Pendapatan</p><p className="text-2xl font-semibold">{uang(laporan.data?.pendapatan ?? 0)}</p></section>
          <section className="rounded-2xl bg-white p-4"><p className="text-sm text-stone-500">Laba kotor</p><p className="text-2xl font-semibold">{uang(laporan.data?.laba_kotor ?? 0)}</p></section>
        </div>
        <div className="overflow-auto rounded-2xl bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500"><tr><th className="px-3 py-2">Order</th><th>Sumber</th><th>Pihak</th><th>Dokumen</th><th>Pendapatan</th><th>Laba kotor</th></tr></thead>
            <tbody>
              {baris.map((k) => <tr key={k.id} className="border-t"><td className="px-3 py-2">{k.nama_barang}<br /><span className="text-stone-500">{k.no_order}</span></td><td>{k.sumber}</td><td>{k.pihak}</td><td>{k.dokumen}<br />{k.invoice}</td><td>{uang(k.pendapatan)}</td><td>{uang(k.laba_kotor)}</td></tr>)}
              {baris.length === 0 ? <tr><td className="px-3 py-3 text-stone-500" colSpan={6}>Belum ada angka. Klik Tampilkan 3 contoh.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <a className="mt-3 block text-sm text-emerald-800" href="/keuangan/invoice">Contoh invoice penjual lain</a>
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
  const impor = useMutation({ mutationFn: () => api<{produk:number;nilai:number}>("/baru/impor", { method: "POST" }), onSuccess: () => segar() });
  const cat = useMutation({ mutationFn: () => api<{nilai:number}>("/baru/cat", { method: "POST" }), onSuccess: () => segar() });
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
        <Pihak />
        <Judul judul="Pengaturan" sub="Produk diketik sekali. Harga tukang dalam rupiah. Cat tidak ikut di sini." />
        <button className="mb-4 rounded-lg bg-emerald-800 px-3 py-2 text-sm text-white" onClick={() => impor.mutate()}>{impor.isPending ? "Mengisi…" : "Isi katalog dari daftar harga"}</button>
        {impor.data ? <p className="mb-3 text-sm">{impor.data.produk} produk, {impor.data.nilai} harga tukang masuk.</p> : null}
        <button className="mb-4 ml-2 rounded-lg border px-3 py-2 text-sm" onClick={() => cat.mutate()}>{cat.isPending ? "Memasang…" : "Pasang tarif cat, termasuk packing biasa"}</button>
        {cat.data ? <p className="mb-3 text-sm">{cat.data.nilai} ukuran dapat tarif cat, sudah termasuk packing biasa. Packing kayu belum ikut.</p> : null}
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
      <Route path="/keuangan/invoice" element={<InvoicePenjual />} />
      <Route path="/pengaturan" element={<Pengaturan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function InvoicePenjual() {
  const baris: { tanggal: string; nama: string; ukuran: string; barang: number; cat: number; proses: number }[] = [
    { tanggal: "28/09/2026 - Senin", nama: "Partisi Rak Palang", ukuran: "80x20x200", barang: 375000, cat: 100000, proses: 10000 },
    { tanggal: "01/10/2026 - Kamis", nama: "Partisi Rak Tengah [tanpa rak]", ukuran: "80x20x200", barang: 450000, cat: 160000, proses: 10000 },
    { tanggal: "02/10/2026 - Jumat", nama: "Partisi Rak Palang", ukuran: "100x20x200", barang: 425000, cat: 120000, proses: 10000 },
  ];
  const uang = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const tot = baris.reduce((a, b) => [a[0] + b.barang, a[1] + b.cat, a[2] + b.proses], [0, 0, 0]);
  return (
    <Bingkai anak={
      <>
        <Judul judul="Invoice penjual lain" sub="Jasa pengecatan sudah termasuk packing biasa. Packing kayu kolom sendiri, sebelum biaya proses." />
        <table className="w-full bg-white text-sm">
          <thead><tr className="bg-slate-600 text-left text-white"><th className="p-2">Tanggal</th><th>Nama barang</th><th>Ukuran</th><th>Harga barang</th><th>Jasa pengecatan</th><th>Packing kayu</th><th>Biaya proses</th><th>Total</th></tr></thead>
          <tbody>
            {baris.map((b) => <tr key={b.tanggal + b.nama} className="border-t"><td className="p-2">{b.tanggal}</td><td>{b.nama}</td><td>{b.ukuran}</td><td>{uang(b.barang)}</td><td>{uang(b.cat)}</td><td>{uang(0)}</td><td>{uang(b.proses)}</td><td>{uang(b.barang + b.cat + b.proses)}</td></tr>)}
            <tr className="border-t font-medium"><td className="p-2" colSpan={3}>Grand total</td><td>{uang(tot[0])}</td><td>{uang(tot[1])}</td><td>{uang(0)}</td><td>{uang(tot[2])}</td><td>{uang(tot[0] + tot[1] + tot[2])}</td></tr>
          </tbody>
        </table>
        <p className="mt-4 text-sm text-stone-600">Contoh ini tidak memakai packing kayu, jadi kolomnya Rp0. Kalau ada, kolom itu terisi dan ikut total. Nomor: INV/MG.1-001/X/2026. INV form invoice, MG.1 minggu ke-1, 001 kode reseller, X Oktober, 2026 tahun. Jatuh tempo 3 hari setelah tanggal invoice.</p>
      </>
    } />
  );
}

function Pihak() {
  const qc = useQueryClient();
  const data = useQuery({ queryKey: ["pihak"], queryFn: () => api<{ reseller: { kode: string; nama: string }[]; tukang: { id: string; nama: string }[] }>("/baru/pihak") });
  const [reseller, setReseller] = useState<{ kode: string; nama: string }[] | null>(null);
  const [tukang, setTukang] = useState<{ id: string; nama: string }[] | null>(null);
  const daftarR = reseller ?? data.data?.reseller ?? [];
  const daftarT = tukang ?? data.data?.tukang ?? [];
  const simpan = useMutation({
    mutationFn: () => api("/baru/pihak", { method: "PATCH", body: { reseller: daftarR, tukang: daftarT } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["pihak"] }),
  });
  return (
    <section className="mb-4 rounded-2xl bg-white p-3 text-sm">
      <p className="font-medium">Empat reseller dan lima tukang</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {daftarR.map((r) => <input key={r.kode} className="rounded-lg border px-2 py-1" value={r.nama} placeholder={`Reseller ${r.kode}`} onChange={(e) => setReseller(daftarR.map((x) => x.kode === r.kode ? { ...x, nama: e.target.value } : x))} />)}
        {daftarT.map((t, i) => <input key={t.id} className="rounded-lg border px-2 py-1" value={t.nama} placeholder={`Tukang ${i + 1}`} onChange={(e) => setTukang(daftarT.map((x) => x.id === t.id ? { ...x, nama: e.target.value } : x))} />)}
      </div>
      <button className="mt-2 rounded-lg border px-3 py-1" onClick={() => simpan.mutate()}>Simpan nama</button>
    </section>
  );
}

function Uji() {
  const qc = useQueryClient();
  const laporan = useQuery({ queryKey: ["laporan-uji"], queryFn: () => api<{pendapatan:number;laba_kotor:number;kasus:{no_order:string;pembeli:string;pendapatan:number;laba_kotor:number;pihak?:string;peran?:string;dokumen?:string;invoice?:string}[]}>("/baru/laporan") });
  const isi = useMutation({ mutationFn: () => api("/baru/uji", { method: "POST" }), onSuccess: () => void qc.invalidateQueries({ queryKey: ["laporan-uji"] }) });
  const hapus = useMutation({ mutationFn: () => api("/baru/uji", { method: "DELETE" }), onSuccess: () => void qc.invalidateQueries({ queryKey: ["laporan-uji"] }) });
  const uang = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);
  return (
    <section className="mt-4 rounded-2xl bg-white p-4 text-sm">
      <h2 className="font-medium">Tiga kasus percobaan</h2>
      <div className="mt-2 flex gap-2">
        <button className="rounded-lg bg-emerald-800 px-3 py-1 text-white" onClick={() => isi.mutate()}>Isi 3 kasus</button>
        <button className="rounded-lg border px-3 py-1" onClick={() => hapus.mutate()}>Hapus 3 kasus</button>
      </div>
      <ul className="mt-3 space-y-1">
        {(laporan.data?.kasus ?? []).map((k) => <li key={k.no_order}>{k.no_order} · {k.pembeli} · {k.peran} {k.pihak} · {k.dokumen} · {k.invoice} · pendapatan {uang(k.pendapatan)} · laba kotor {uang(k.laba_kotor)}</li>)}
      </ul>
      {laporan.data ? <p className="mt-2">Total pendapatan {uang(laporan.data.pendapatan)}. Laba kotor {uang(laporan.data.laba_kotor)}.</p> : null}
    </section>
  );
}
