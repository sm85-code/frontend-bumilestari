import { useState } from "react";
import { money, useChoices, useKeuAction, useResource } from "../api";
import type { Allocation, Item, Product, Vendor } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

export default function Production() {
  const [offset, setOffset] = useState(0);
  const allocations = useResource<Allocation>("/alokasi-vendor", offset);
  const items = useChoices<Item>("/item");
  const products = useChoices<Product>("/produk");
  const vendors = useChoices<Vendor>("/vendor");
  const action = useKeuAction();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try { await action.mutateAsync({ path: "/alokasi-vendor", body: { ...values, qty: Number(values.qty) } }); form.reset(); } catch { /* Shown by ErrorMessage. */ }
  }
  return <><Heading title="Produksi">Alokasikan item ke tukang kayu atau supplier. Kuantitas total dijaga oleh backend dan database.</Heading><ErrorMessage error={allocations.error ?? items.error ?? products.error ?? vendors.error ?? action.error} /><Panel title="Alokasi vendor"><form onSubmit={event => void save(event)} className="grid gap-3 sm:grid-cols-2"><Field label="Item pesanan"><select name="item_id" required className={inputClass}><option value="">Pilih item yang sudah dipetakan</option>{items.data?.filter(i => products.data?.some(p => p.id === i.produk_id && p.aktif && p.status !== "draf")).map(i => <option key={i.id} value={i.id}>{i.nama_snapshot} · {i.sumber_ref} · {i.qty} unit</option>)}</select></Field><Field label="Vendor"><select name="vendor_id" required className={inputClass}><option value="">Pilih vendor</option>{vendors.data?.filter(v => v.aktif).map(v => <option key={v.id} value={v.id}>{v.kode} · {v.nama} · {v.tipe === "kayu" ? "Tukang kayu" : "Supplier"}</option>)}</select></Field><Field label="Kuantitas alokasi"><input type="number" name="qty" min={1} max={10000} step={1} required defaultValue={1} className={inputClass} /></Field><Field label="Biaya per unit"><input name="biaya_satuan" inputMode="decimal" required pattern="[0-9]+(\.[0-9]{1,2})?" className={inputClass} /></Field><Button type="submit" disabled={action.isPending || vendors.isLoading || items.isLoading || products.isLoading || !!vendors.error || !!items.error || !!products.error}>Simpan alokasi</Button></form></Panel><Panel title="Daftar alokasi">{allocations.isLoading ? <Loading /> : !allocations.data?.rows.length ? <Empty /> : <Table headers={["Item", "Vendor", "Kuantitas", "Biaya per unit", "Status"]}>{allocations.data.rows.map(a => <tr key={a.id} className="border-b"><td className="px-3 py-2">{items.data?.find(i => i.id === a.item_id)?.nama_snapshot ?? a.item_id}</td><td>{vendors.data?.find(v => v.id === a.vendor_id)?.nama ?? a.vendor_id}</td><td>{a.qty}</td><td>{money(a.biaya_satuan)}</td><td>{a.dibatalkan ? "Dibatalkan" : <Cancel id={a.id} />}</td></tr>)}</Table>}<Pager offset={offset} total={allocations.data?.total ?? 0} onChange={setOffset} /></Panel></>;
}
function Cancel({ id }: { id: string }) {
  const action = useKeuAction();
  const [open, setOpen] = useState(false);
  return <>{open ? <form onSubmit={event => { event.preventDefault(); const reason = new FormData(event.currentTarget).get("alasan"); action.mutate({ path: `/alokasi-vendor/${id}/batal`, body: { alasan: reason } }); }}><input aria-label="Alasan pembatalan alokasi" name="alasan" required minLength={3} maxLength={2000} className={inputClass} /><Button type="submit" disabled={action.isPending}>Konfirmasi batal</Button><ErrorMessage error={action.error} /></form> : <Button onClick={() => setOpen(true)}>Batalkan alokasi</Button>}</>;
}
