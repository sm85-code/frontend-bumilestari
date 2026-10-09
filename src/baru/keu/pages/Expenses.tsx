import { InputDialog, useCloseFinanceDialog } from "../components/FinanceUI";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { query } from "../../../lib/api";
import { keu, money, today, useChoices, useKeuAction } from "../api";
import type { Account, Journal, Page, VendorDebt } from "../types";
import UnpostEntry from "../components/UnpostEntry";
import { Button, Empty, ErrorMessage, Field, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

const tabs = [
  ["vendor", "Pembayaran Tukang & Supplier"],
  ["bahan", "Belanja Cat & Bahan Pendukung"],
  ["operasional", "Belanja Operasional"],
  ["gaji_iklan", "Gaji Karyawan & Iklan"],
] as const;
type Tab = typeof tabs[number][0];
type Category = { id: string; nama: string; tab: Tab };
type Expense = Journal & { jumlah: string; tab: Tab; rincian: Record<string, unknown>; vendor_nama?: string; akun_nama?: string };
const amountPattern = "[0-9]+(\\.[0-9]{1,2})?";

export default function Expenses() {
  const [tab, setTab] = useState<Tab>("vendor");
  return <Panel title="Pengeluaran Keuangan">
    <div role="tablist" aria-label="Tab pengeluaran" className="mb-4 flex flex-wrap gap-2">
      {tabs.map(([id, title]) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-controls={`pengeluaran-${id}`} className={inputClass} onClick={() => setTab(id)}>{title}</button>)}
    </div>
    <div role="tabpanel" id={`pengeluaran-${tab}`} aria-label={tabs.find(([id]) => id === tab)?.[1]}>
      <Workspace key={tab} tab={tab} />
    </div>
  </Panel>;
}

export function Workspace({ tab }: { tab: Tab }) {
  const [start, setStart] = useState(today().slice(0, 7) + "-01");
  const [end, setEnd] = useState(today());
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState(false);
  const [offset, setOffset] = useState(0);
  const valid = Boolean(start && end && start <= end);
  const rows = useQuery({
    queryKey: ["keu", "pengeluaran", tab, start, end, search, history, offset],
    queryFn: ({ signal }) => keu<Page<Expense>>(`/pengeluaran${query({ tab, tanggal_awal: start, tanggal_akhir: end, search, status: history ? "batal" : "pengerjaan", limit: 50, offset })}`, { signal }),
    enabled: valid,
  });
  return <div className="grid gap-4">
    <InputDialog title={tab === "vendor" ? "Bayar tukang / supplier" : "Catat pengeluaran"} label={tab === "vendor" ? "Bayar tagihan" : "Tambah pengeluaran"}>{tab === "vendor" ? <VendorPayment /> : <ExpenditureForm tab={tab} />}</InputDialog>
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Tanggal awal pengeluaran"><input type="date" value={start} className={inputClass} onChange={e => { setStart(e.target.value); setOffset(0); }} /></Field>
      <Field label="Tanggal akhir pengeluaran"><input type="date" value={end} className={inputClass} onChange={e => { setEnd(e.target.value); setOffset(0); }} /></Field>
      <Field label="Cari pengeluaran"><input value={search} maxLength={255} placeholder="Keterangan, kategori atau vendor" className={inputClass} onChange={e => { setSearch(e.target.value); setOffset(0); }} /></Field>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button aria-pressed={!history} onClick={() => { setHistory(false); setOffset(0); }}>Pengeluaran Aktif</Button>
      <Button aria-pressed={history} onClick={() => { setHistory(true); setOffset(0); }}>Riwayat Pengeluaran Dibatalkan</Button>
    </div>
    {!valid && <p role="alert">Tanggal awal pengeluaran tidak boleh melebihi tanggal akhir.</p>}
    <ErrorMessage error={rows.error} />
    {valid && (rows.isLoading ? <Loading /> : !rows.data?.rows.length ? <Empty /> : <Table headers={["Tanggal", "Kategori / Vendor / Keterangan", "Kas Keluar", "Status / Aksi"]}>
      {rows.data.rows.map(row => <tr key={row.id} className="border-b">
        <td className="px-3 py-2">{row.tanggal}</td>
        <td>{String(row.rincian?.kategori_nama ?? row.rincian?.kategori_asli ?? (tab === "vendor" ? "Pelunasan utang vendor" : "Jurnal pengeluaran"))}<p className="text-sm">{row.vendor_nama}</p><p className="text-sm">{row.keterangan}</p></td>
        <td className="whitespace-nowrap">{money(row.jumlah)}<p className="text-xs">{row.akun_nama}</p></td>
        <td>{row.status === "terkirim" ? <UnpostEntry id={row.id} resource="jurnal" /> : <div>Dibatalkan<p className="text-sm">{row.alasan_batal}</p></div>}</td>
      </tr>)}
    </Table>)}
    <Pager offset={offset} total={valid ? rows.data?.total ?? 0 : 0} onChange={setOffset} />
  </div>;
}

function ExpenditureForm({ tab }: { tab: Exclude<Tab, "vendor"> }) {
  const close = useCloseFinanceDialog();
  const accounts = useChoices<Account>("/akun");
  const categories = useQuery({ queryKey: ["keu", "pengeluaran-kategori"], queryFn: () => keu<Category[]>("/pengeluaran/kategori") });
  const action = useKeuAction();
  const [reference, setReference] = useState(() => crypto.randomUUID());
  return <>
    <p className="text-sm">{tab === "bahan" ? "Pembelian bahan pendukung pada tab ini langsung dibebankan ke HPP Bahan saat pembayaran." : tab === "operasional" ? "Kategori menentukan akun sewa, langganan, pemeliharaan atau operasional." : "Gaji dan insentif masuk Beban Gaji; pembayaran saldo iklan masuk Beban Pemasaran/Iklan."}</p>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => {
      event.preventDefault();
      const form = event.currentTarget;
      void action.mutateAsync({ path: "/pengeluaran", body: { ...Object.fromEntries(new FormData(form)), tab, referensi: reference } })
        .then(() => { setReference(crypto.randomUUID()); form.reset(); close(); }).catch(() => {});
    }}>
      <Field label="Tanggal pembayaran pengeluaran"><input name="tanggal" type="date" required defaultValue={today()} className={inputClass} /></Field>
      <Field label="Akun pembayaran pengeluaran"><select name="akun_kas_id" required className={inputClass}><option value="">Pilih kas/bank aktif</option>{accounts.data?.filter(a => a.aktif).map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}</select></Field>
      <Field label="Kategori pengeluaran"><select name="kategori" required className={inputClass}><option value="">Pilih kategori</option>{categories.data?.filter(c => c.tab === tab).map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field>
      <Field label="Jumlah pengeluaran"><input name="jumlah" required inputMode="decimal" pattern={amountPattern} className={inputClass} /></Field>
      <Field label="Keterangan pengeluaran"><textarea name="keterangan" required minLength={3} maxLength={2000} className={inputClass} /></Field>
      <Button type="submit" disabled={action.isPending || categories.isLoading}>Posting Pengeluaran</Button>
      <ErrorMessage error={accounts.error ?? categories.error ?? action.error} />
    </form>
  </>;
}

function VendorPayment() {
  const close = useCloseFinanceDialog();
  const debts = useChoices<VendorDebt>("/utang-vendor");
  const accounts = useChoices<Account>("/akun");
  const action = useKeuAction();
  const [reference, setReference] = useState(() => crypto.randomUUID());
  return <>
    <p className="text-sm">HPP Vendor diakui saat produksi selesai. Pelunasan mengurangi Kas/Bank dan Utang Vendor, sehingga HPP tidak dicatat dua kali.</p>
    <ErrorMessage error={debts.error ?? accounts.error ?? action.error} />
    <Table headers={["Tukang / Supplier", "Sisa Utang"]}>{debts.data?.map(v => <tr key={v.id} className="border-b"><td className="px-3 py-2">{v.nama}</td><td>{money(v.utang)}</td></tr>)}</Table>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => {
      event.preventDefault();
      const form = event.currentTarget;
      void action.mutateAsync({ path: "/vendor/pembayaran", body: { ...Object.fromEntries(new FormData(form)), referensi: reference } })
        .then(() => { setReference(crypto.randomUUID()); form.reset(); close(); }).catch(() => {});
    }}>
      <Field label="Vendor yang dibayar"><select name="vendor_id" required className={inputClass}><option value="">Pilih vendor</option>{debts.data?.map(v => <option key={v.id} value={v.id}>{v.nama} · Utang {money(v.utang)}</option>)}</select></Field>
      <Field label="Akun pembayaran vendor"><select name="akun_kas_id" required className={inputClass}><option value="">Pilih kas/bank</option>{accounts.data?.filter(a => a.aktif).map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}</select></Field>
      <Field label="Tanggal pembayaran vendor"><input type="date" name="tanggal" required defaultValue={today()} className={inputClass} /></Field>
      <Field label="Jumlah pembayaran vendor"><input name="jumlah" required inputMode="decimal" pattern={amountPattern} className={inputClass} /></Field>
      <Field label="Catatan pembayaran vendor"><input name="keterangan" maxLength={2000} className={inputClass} /></Field>
      <Button type="submit" disabled={action.isPending}>Posting Pembayaran Vendor</Button>
    </form>
  </>;
}
