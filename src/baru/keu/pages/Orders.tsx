import { useState } from "react";
import { multiplyMoney, money, today, useChoices, useKeuAction, useResource } from "../api";
import type { Channel, Customer, Order, Product } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

export default function Orders() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [localError, setError] = useState<unknown>(null);
  const [requestRef, setRequestRef] = useState(() => crypto.randomUUID());
  const orders = useResource<Order>("/pesanan", offset, search);
  const products = useChoices<Product>("/produk");
  const channels = useChoices<Channel>("/saluran");
  const customers = useChoices<Customer>("/pelanggan");
  const action = useKeuAction();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try {
      const qty = Number(values.qty), total = multiplyMoney(values.harga_satuan, qty);
      const product = products.data?.find(p => p.id === values.produk_id);
      if (!product) throw new Error("Pilih produk terlebih dahulu.");
      await action.mutateAsync({ path: "/pesanan", body: { saluran_id: values.saluran_id, sumber_ref: requestRef, nomor: values.nomor,
        tanggal: values.tanggal, pelanggan_id: values.pelanggan_id || null, status_sumber: "manual", total_sumber: total,
        items: [{ sumber_ref: `${requestRef}:1`, produk_id: product.id, nama_snapshot: product.nama, varian_snapshot: values.varian_snapshot,
          qty, harga_satuan: values.harga_satuan, subtotal_sumber: total }] } });
      setOpen(false); setRequestRef(crypto.randomUUID());
    } catch (e) { setError(e); }
  }
  return <><Heading title="Order">Data sumber dan status produksi terpisah. Gunakan Sinkronisasi untuk menarik order Store atau ERP.</Heading><Button onClick={() => setOpen(!open)}>{open ? "Tutup form" : "Input pesanan manual"}</Button><ErrorMessage error={orders.error ?? products.error ?? channels.error ?? customers.error ?? localError ?? action.error} />
    {open && <Panel title="Pesanan manual"><form onSubmit={event => void save(event)} className="grid gap-3 sm:grid-cols-2"><Field label="Saluran manual"><select required name="saluran_id" className={inputClass}><option value="">Pilih saluran</option>{channels.data?.filter(c => c.aktif && c.sistem === "manual").map(c => <option value={c.id} key={c.id}>{c.nama}</option>)}</select></Field><Field label="Nomor pesanan"><input name="nomor" required maxLength={128} className={inputClass} /></Field><Field label="Tanggal"><input name="tanggal" type="date" defaultValue={today()} required className={inputClass} /></Field><Field label="Pelanggan"><select name="pelanggan_id" className={inputClass}><option value="">Tanpa pelanggan terdaftar</option>{customers.data?.map(c => <option value={c.id} key={c.id}>{c.nama}</option>)}</select></Field><Field label="Produk"><select name="produk_id" required className={inputClass}><option value="">Pilih produk</option>{products.data?.filter(p => p.aktif).map(p => <option value={p.id} key={p.id}>{p.nama} · {p.sku}</option>)}</select></Field><Field label="Varian"><input name="varian_snapshot" maxLength={255} className={inputClass} /></Field><Field label="Kuantitas"><input name="qty" type="number" min={1} max={10000} step={1} defaultValue={1} required className={inputClass} /></Field><Field label="Harga satuan (contoh 125000.00)"><input name="harga_satuan" inputMode="decimal" required pattern="[0-9]+(\.[0-9]{1,2})?" className={inputClass} /></Field><Button type="submit" disabled={action.isPending}>{action.isPending ? "Menyimpan…" : "Simpan pesanan"}</Button></form></Panel>}
    <Panel title="Daftar pesanan"><Field label="Cari nomor pesanan"><input className={inputClass} value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></Field>{orders.isLoading ? <Loading /> : !orders.data?.rows.length ? <Empty /> : orders.data.rows.map(order => <section key={order.id} className="my-4 rounded-lg border p-3"><div className="mb-3 flex flex-wrap justify-between gap-2 text-sm"><strong>{order.nomor} · {order.tanggal}</strong><span>{money(order.total_sumber)} · Produksi: {order.status} · Sumber: {order.status_sumber}</span></div><Table headers={["Barang", "Kuantitas", "Harga", "Pemetaan"]}>{order.items.map(item => <tr key={item.id} className="border-b"><td className="px-3 py-2">{item.nama_snapshot}<br />{item.varian_snapshot}</td><td>{item.qty}</td><td>{money(item.harga_satuan)}</td><td><select aria-label={`Produk ${item.nama_snapshot}`} className={inputClass} value={item.produk_id ?? ""} disabled={action.isPending} onChange={event => { if (event.target.value) action.mutate({ path: `/item/${item.id}/produk`, method: "PATCH", body: { produk_id: event.target.value } }); }}><option value="">Belum dipetakan</option>{products.data?.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></td></tr>)}</Table><div className="mt-3 flex flex-wrap gap-2">{order.status === "draf" && <Button disabled={action.isPending} onClick={() => action.mutate({ path: `/pesanan/${order.id}/status`, body: { status: "aktif" } })}>Mulai produksi</Button>}{order.status === "aktif" && <Button disabled={action.isPending} onClick={() => action.mutate({ path: `/pesanan/${order.id}/status`, body: { status: "selesai" } })}>Selesaikan pesanan</Button>}</div></section>)}<Pager offset={offset} total={orders.data?.total ?? 0} onChange={setOffset} /></Panel></>;
}
