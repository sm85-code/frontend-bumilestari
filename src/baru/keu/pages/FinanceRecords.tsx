import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keu, money, today, useChoices, useKeuAction, useResource } from "../api";
import type { Account, Category, Channel, Item, PayoutAllocation, Settlement, Transaction } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

import { InputDialog, useCloseFinanceDialog } from "../components/FinanceUI";
import { useBook } from "../components/BookSettings";
import UnpostEntry from "../components/UnpostEntry";

export default function FinanceRecords() {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const book = useBook();
  const [offset, setOffset] = useState(0);
  const [history, setHistory] = useState(false);
  const transactions = useResource<Transaction>("/transaksi", offset, "", history ? "batal" : "pengerjaan");
  const [settlementOffset, setSettlementOffset] = useState(0);
  const [settlementHistory, setSettlementHistory] = useState(false);
  const settlements = useResource<Settlement>("/settlement", settlementOffset, "", settlementHistory ? "batal" : "pengerjaan");
  const accounts = useChoices<Account>("/akun");
  const channels = useChoices<Channel>("/saluran");
  const categories = useQuery({ queryKey: ["keu", "kategori"], queryFn: () => keu<Category[]>("/kategori") });
  const action = useKeuAction();
  const [reference, setReference] = useState(() => crypto.randomUUID());
  const [kind, setKind] = useState("keluar");
  const cashKind = book.data?.aktif ? "masuk" : kind;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try { await action.mutateAsync({ path: "/transaksi", body: { ...values, jenis: cashKind, sumber_ref: reference } }); setReference(crypto.randomUUID()); form.reset(); setReceiptOpen(false); } catch { /* Error rendered below. */ }
  }
  return <><Heading title="Penerimaan & Pencairan">Catatan manual dibuat sebagai draf. Kas berubah setelah posting; settlement dicatat sebesar neto.</Heading><ErrorMessage error={transactions.error ?? settlements.error ?? accounts.error ?? channels.error ?? categories.error ?? action.error} />
    <InputDialog open={receiptOpen} onOpenChange={setReceiptOpen} title="Catat penerimaan" label="Tambah penerimaan"><Panel title={book.data?.aktif ? "Pemasukan kas manual" : "Catatan kas manual"}><form onSubmit={event => void save(event)} className="grid gap-3 sm:grid-cols-2">
      <Field label="Saluran manual"><select required name="saluran_id" className={inputClass}><option value="">Pilih saluran</option>{channels.data?.filter(c => c.aktif && c.sistem === "manual").map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field>
      <Field label="Akun kas"><select required name="akun_id" className={inputClass}><option value="">Pilih akun</option>{accounts.data?.filter(a => a.aktif).map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}</select></Field>
      <Field label="Jenis transaksi"><select name="jenis" value={cashKind} onChange={event => setKind(event.target.value)} className={inputClass}>{!book.data?.aktif && <option value="keluar">Pengeluaran</option>}<option value="masuk">Pemasukan</option></select></Field>
      <Field label="Kategori"><select required name="kategori_id" className={inputClass}><option value="">Pilih kategori</option>{categories.data?.filter(c => c.jenis === (cashKind === "masuk" ? "pemasukan" : "pengeluaran")).map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field>
      <Field label="Tanggal"><input required type="date" name="tanggal" defaultValue={today()} className={inputClass} /></Field><Field label="Jumlah"><input required name="jumlah" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" className={inputClass} /></Field>
      <Field label="Keterangan"><input name="keterangan" maxLength={2000} className={inputClass} /></Field><Button type="submit" disabled={action.isPending}>Simpan draf kas</Button>
    </form></Panel></InputDialog>
    <Panel title="Buku kas"><div className="mb-3 flex flex-wrap gap-2"><Button aria-pressed={!history} onClick={() => { setHistory(false); setOffset(0); }}>Buku Kas Aktif</Button><Button aria-pressed={history} onClick={() => { setHistory(true); setOffset(0); }}>Riwayat Batal Post</Button></div>{transactions.isLoading ? <Loading /> : !transactions.data?.rows.length ? <Empty /> : <Table headers={["Tanggal", "Akun", "Jenis", "Jumlah", "Keterangan", "Status"]}>{transactions.data.rows.map(t => <tr key={t.id} className="border-b"><td className="px-3 py-2">{t.tanggal}</td><td>{accounts.data?.find(a => a.id === t.akun_id)?.nama ?? t.akun_id}</td><td>{t.jenis}</td><td className="whitespace-nowrap">{money(t.jumlah)}</td><td>{t.keterangan}</td><td>{t.status === "draf" ? <Button disabled={action.isPending} onClick={() => action.mutate({ path: `/transaksi/${t.id}/posting` })}>Posting kas</Button> : t.status === "terkirim" ? <UnpostEntry id={t.id} resource="transaksi" /> : <div>Dibatalkan<p className="text-xs">{t.alasan_batal}</p><p className="text-xs">{t.dibatalkan_at} · {t.dibatalkan_oleh}</p></div>}</td></tr>)}</Table>}<Pager offset={offset} total={transactions.data?.total ?? 0} onChange={setOffset} /></Panel>
    <InputDialog title="Catat pencairan marketplace" label="Tambah pencairan"><NewSettlement channels={channels.data ?? []} /></InputDialog>
    <Panel title="Rekonsiliasi settlement"><div className="mb-3 flex flex-wrap gap-2"><Button aria-pressed={!settlementHistory} onClick={() => { setSettlementHistory(false); setSettlementOffset(0); }}>Settlement Aktif</Button><Button aria-pressed={settlementHistory} onClick={() => { setSettlementHistory(true); setSettlementOffset(0); }}>Riwayat Settlement Dibatalkan</Button></div>{settlements.isLoading ? <Loading /> : !settlements.data?.rows.length ? <Empty /> : settlements.data.rows.map(s => <SettlementEditor key={s.id} value={s} accounts={accounts.data ?? []} categories={categories.data ?? []} />)}<Pager offset={settlementOffset} total={settlements.data?.total ?? 0} onChange={setSettlementOffset} /></Panel>
  </>;
}
function NewSettlement({ channels }: { channels: Channel[] }) {
  const close = useCloseFinanceDialog();
  const action = useKeuAction();
  const [reference, setReference] = useState(() => crypto.randomUUID());
  const [channel, setChannel] = useState("");
  const store = channels.find(c => c.id === channel)?.sistem === "store";
  return <Panel title="Settlement manual"><p className="mb-3 text-sm text-stone-600">Pencatatan internal berdasarkan dokumen pencairan; tidak mengubah Store/ERP asal. Bruto − potongan + penyesuaian wajib sama dengan neto.</p><form className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); const proof = String(values.bukti_pencairan ?? "").trim(); if (!proof) delete values.bukti_pencairan; void action.mutateAsync({ path: proof ? "/settlement/manual-bukti" : "/settlement", body: { ...values, sumber_ref: reference } }).then(() => { setReference(crypto.randomUUID()); form.reset(); close(); }).catch(() => {}); }}>
    <Field label="Saluran settlement"><select required name="saluran_id" value={channel} onChange={e => setChannel(e.target.value)} className={inputClass}><option value="">Pilih saluran</option>{channels.filter(c => c.aktif).map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field><Field label="Tanggal cair"><input required type="date" name="tanggal_cair" defaultValue={today()} className={inputClass} /></Field>
    <Field label="Bukti pencairan (wajib untuk Store)"><input name="bukti_pencairan" required={store} minLength={3} maxLength={2000} placeholder="Nomor referensi bank / tautan dokumen" className={inputClass} /></Field>
    {["bruto", "potongan", "penyesuaian", "neto"].map(key => <Field key={key} label={key[0].toUpperCase() + key.slice(1)}><input required name={key} inputMode="decimal" pattern="-?[0-9]+(\.[0-9]{1,2})?" defaultValue={key === "penyesuaian" || key === "potongan" ? "0" : undefined} className={inputClass} /></Field>)}<Button type="submit" disabled={action.isPending}>Simpan draf settlement</Button><ErrorMessage error={action.error} />
  </form></Panel>;
}
function SettlementEditor({ value, accounts, categories }: { value: Settlement; accounts: Account[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const items = useChoices<Item>("/item");
  const allocations = useChoices<PayoutAllocation>("/alokasi-settlement");
  const action = useKeuAction();
  const negative = value.neto.startsWith("-");
  return <article className="mb-4 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>{value.sumber_ref}</strong><p className="text-sm">{value.tanggal_cair} · neto {money(value.neto)} · {value.status}</p></div>{value.status === "terkirim" && <UnpostEntry id={value.id} resource="settlement" />}{value.status === "dibatalkan" && <p className="text-sm">{value.alasan_batal} · {value.dibatalkan_at} · {value.dibatalkan_oleh}</p>}{value.status === "draf" && <Button onClick={() => setOpen(!open)}>Rekonsiliasi</Button>}</div>
    {open && <div className="mt-3 grid gap-4"><ErrorMessage error={action.error ?? items.error ?? allocations.error} /><Table headers={["Item", "Alokasi"]}>{allocations.data?.filter(a => a.settlement_id === value.id).map(a => <tr key={a.id}><td>{items.data?.find(i => i.id === a.item_id)?.nama_snapshot ?? a.item_id}</td><td>{money(a.jumlah)}</td></tr>)}</Table>
      <form className="grid gap-2 sm:grid-cols-3" onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); action.mutate({ path: "/alokasi-settlement", body: { ...values, settlement_id: value.id } }); }}><Field label="Item untuk settlement"><select required name="item_id" className={inputClass}><option value="">Pilih item</option>{items.data?.map(i => <option key={i.id} value={i.id}>{i.nama_snapshot} · {i.sumber_ref}</option>)}</select></Field><Field label="Jumlah alokasi neto"><input name="jumlah" required inputMode="decimal" pattern="-?[0-9]+(\.[0-9]{1,2})?" className={inputClass} /></Field><Button type="submit" disabled={action.isPending}>Simpan alokasi neto</Button></form>
      <form className="grid gap-2 sm:grid-cols-3" onSubmit={event => { event.preventDefault(); action.mutate({ path: `/settlement/${value.id}/posting`, body: Object.fromEntries(new FormData(event.currentTarget)) }); }}><Field label="Akun penerima settlement"><select required name="akun_id" className={inputClass}><option value="">Pilih akun</option>{accounts.filter(a => a.aktif).map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}</select></Field><Field label="Kategori settlement"><select required name="kategori_id" className={inputClass}><option value="">Pilih kategori</option>{categories.filter(c => c.jenis === (negative ? "pengeluaran" : "pemasukan")).map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field><Button type="submit" disabled={action.isPending}>Posting settlement</Button></form><p className="text-sm text-stone-600">Posting hanya diterima setelah total alokasi sama dengan neto. Posting ulang tidak menggandakan kas.</p>
    </div>}
  </article>;
}
