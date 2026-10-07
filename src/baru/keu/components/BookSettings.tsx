import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { keu, today, useChoices, useKeuAction } from "../api";
import type { Book, Category, Coa } from "../types";
import { Button, ErrorMessage, Field, inputClass, Panel, Table } from "./UI";

export function useBook() { return useQuery({ queryKey: ["keu", "buku"], queryFn: () => keu<Book>("/buku") }); }
export function BookNotice() {
  const book = useBook();
  return <><ErrorMessage error={book.error} />{book.data && !book.data.aktif && <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Buku besar belum aktif. Owner perlu <Link to="/pengaturan" className="underline">mengaktifkan dan memigrasikan histori di Pengaturan</Link> sebelum memakai mutasi, piutang, stok, dan laporan.</p>}</>;
}
export default function BookSettings() {
  const book = useBook();
  const { user } = useAuth();
  const action = useKeuAction();
  const [confirmation, setConfirmation] = useState("");
  return <Panel title="Buku besar & migrasi histori"><ErrorMessage error={book.error ?? action.error} />{book.data?.aktif ? <p className="text-sm">Aktif sejak {book.data.pengaturan?.tanggal_awal}. Stok FIFO per batch. Escrow memakai tanggal perubahan sumber; backfill memakai tanggal pesanan asli.</p> : <><p className="mb-3 text-sm">Aktivasi memigrasikan seluruh histori keu dengan tanggal asli. Saldo awal menjadi modal sebelum transaksi pertama. Histori batal dikecualikan. Seluruh migrasi dibatalkan jika ada data yang tidak dapat direkonsiliasi.</p>{user?.role === "owner" ? <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); action.mutate({ path: "/buku/aktivasi", body: { tanggal_awal: today(), metode_stok: "fifo", tanggal_status: "updated_at", histori: true, konfirmasi: confirmation } }); }}><Field label="Konfirmasi aktivasi (AKTIFKAN-BUKU-KEU)"><input required value={confirmation} onChange={event => setConfirmation(event.target.value)} className={inputClass} /></Field><Button type="submit" disabled={confirmation !== "AKTIFKAN-BUKU-KEU" || action.isPending || book.isLoading}>Aktifkan & Migrasikan Histori</Button></form> : <p className="text-sm">Aktivasi hanya dapat dilakukan owner.</p>}</>}{book.data?.aktif && <Chart />}</Panel>;
}
function Chart() {
  const accounts = useChoices<Coa>("/coa");
  const categories = useQuery({ queryKey: ["keu", "kategori"], queryFn: () => keu<Category[]>("/kategori") });
  const mappings = useQuery({ queryKey: ["keu", "kategori-coa"], queryFn: () => keu<{ id: string; coa_id: string; arus: string }[]>("/kategori-coa") });
  const action = useKeuAction();
  const [editing, setEditing] = useState<Coa | null>(null);
  const [kind, setKind] = useState("beban");
  const groups: Record<string, string[]> = { aset: ["aset_lain"], kewajiban: ["kewajiban_lain"], ekuitas: ["ekuitas_lain"], pendapatan: ["pendapatan_lain"], beban: ["beban_operasional", "beban_langganan", "beban_sewa", "beban_pemeliharaan", "beban_admin"] };
  return <div className="mt-5 grid gap-4"><ErrorMessage error={accounts.error ?? categories.error ?? mappings.error ?? action.error} /><h3 className="font-semibold">Bagan Akun</h3><Table headers={["Kode", "Nama", "Jenis / Kelompok", "Aksi"]}>{accounts.data?.map(account => <tr key={account.id} className="border-b"><td className="px-3 py-2">{account.kode}</td><td>{account.nama}</td><td>{account.jenis} · {account.kelompok.replaceAll("_", " ")}</td><td>{account.sistem ? "Akun sistem" : <><Button onClick={() => { setEditing(account); setKind(account.jenis); }}>Edit</Button><Button disabled={action.isPending} onClick={() => action.mutate({ path: `/coa/${account.id}/status`, method: "PATCH", body: { aktif: !account.aktif } })}>{account.aktif ? "Nonaktifkan" : "Aktifkan"}</Button></>}</td></tr>)}</Table>
    <form key={editing?.id ?? "new"} className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); void action.mutateAsync({ path: editing ? `/coa/${editing.id}` : "/coa", method: editing ? "PATCH" : "POST", body }).then(() => { setEditing(null); setKind("beban"); form.reset(); }).catch(() => {}); }}>
      <Field label="Kode bagan akun"><input name="kode" required maxLength={64} defaultValue={editing?.kode} className={inputClass} /></Field><Field label="Nama bagan akun"><input name="nama" required maxLength={128} defaultValue={editing?.nama} className={inputClass} /></Field>
      <Field label="Jenis bagan akun"><select name="jenis" value={kind} onChange={event => setKind(event.target.value)} className={inputClass}>{Object.keys(groups).map(value => <option key={value} value={value}>{value}</option>)}</select></Field><Field label="Kelompok bagan akun"><select key={kind} name="kelompok" defaultValue={editing?.jenis === kind ? editing.kelompok : undefined} className={inputClass}>{groups[kind].map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></Field><Button type="submit" disabled={action.isPending}>{editing ? "Simpan Bagan Akun" : "+ Tambah Bagan Akun"}</Button>{editing && <Button onClick={() => { setEditing(null); setKind("beban"); }}>Batal edit bagan akun</Button>}
    </form><h3 className="font-semibold">Pemetaan kategori kas ke bagan akun</h3><p className="text-sm">Pemetaan berlaku pada posting berikutnya. Jurnal historis mempertahankan akun saat migrasi; koreksi dilakukan dengan Batal Post dan jurnal baru.</p>
    {categories.data?.map(category => { const mapping = mappings.data?.find(row => row.id === category.id); return <form key={`${category.id}-${mapping?.coa_id}-${mapping?.arus}`} className="grid gap-2 sm:grid-cols-4" onSubmit={event => { event.preventDefault(); action.mutate({ path: `/kategori-coa/${category.id}`, method: "PUT", body: Object.fromEntries(new FormData(event.currentTarget)) }); }}><strong>{category.nama}</strong><Field label={`Akun untuk ${category.nama}`}><select name="coa_id" required defaultValue={mapping?.coa_id ?? ""} className={inputClass}><option value="">Pemetaan otomatis kategori bawaan</option>{accounts.data?.filter(row => row.aktif && !["kas", "utang_vendor", "persediaan", "piutang_pengiriman", "piutang_escrow", "hpp_stok", "hpp_vendor"].includes(row.kelompok)).map(row => <option key={row.id} value={row.id}>{row.nama}</option>)}</select></Field><Field label={`Arus kas ${category.nama}`}><select name="arus" defaultValue={mapping?.arus ?? "operasional"} className={inputClass}>{["operasional", "investasi", "pendanaan"].map(value => <option key={value}>{value}</option>)}</select></Field><Button type="submit" disabled={action.isPending}>Simpan Pemetaan</Button></form>; })}
  </div>;
}
