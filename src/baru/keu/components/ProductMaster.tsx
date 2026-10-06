import MasterActions from "./MasterActions";
import { useState } from "react";
import { money, useKeuAction, useResource } from "../api";
import type { Product, ProductVariant } from "../types";
import { Button, Empty, ErrorMessage, Field, inputClass, Loading, Pager, Panel, Table } from "./UI";

function Thumbnail({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed || !/^https?:\/\//i.test(url)) return <span className="flex h-16 w-16 items-center justify-center rounded bg-stone-100 text-xs text-stone-500">Tanpa foto</span>;
  return <img src={url} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-16 w-16 rounded object-contain" />;
}

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const action = useKeuAction();
  const [variants, setVariants] = useState<ProductVariant[]>(product?.varian_list ?? []);
  const [localError, setLocalError] = useState<Error | null>(null);
  function variant(index: number, key: keyof ProductVariant, value: string) {
    setVariants(rows => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const body: Record<string, unknown> = { nama: values.nama.trim(), jenis: values.jenis, biaya_acuan: values.biaya_acuan,
      varian_list: variants.map(row => ({ kategori: row.kategori.trim(), nilai: row.nilai.trim() })) };
    if (!product) Object.assign(body, { sku: values.sku.trim(), sku_induk: values.sku_induk.trim() || null,
      gambar_url: values.gambar_url.trim(), harga_jual: values.harga_jual });
    try {
      await action.mutateAsync({ path: product ? `/produk/${encodeURIComponent(product.id)}` : "/produk", method: product ? "PATCH" : "POST", body });
      onClose();
    } catch (error) { setLocalError(error instanceof Error ? error : new Error("Produk belum tersimpan.")); }
  }
  return <Panel title={product ? `Pemetaan ${product.sku}` : "Produk manual baru"}>
    <p className="mb-4 text-sm text-stone-600">SKU varian menjadi identitas tetap. Simpan sebagai master setelah jenis dan modal diperiksa.</p>
    <form onSubmit={event => void save(event)} className="grid gap-3 sm:grid-cols-2">
      {product ? <div className="sm:col-span-2 flex flex-wrap gap-4 rounded bg-stone-50 p-3">
        <Thumbnail key={product.gambar_url} url={product.gambar_url} name={product.nama_asli} />
        <dl className="min-w-0 flex-1 break-words text-sm"><dt>SKU varian</dt><dd className="font-semibold">{product.sku}</dd><dt>SKU induk</dt><dd>{product.sku_induk ?? "—"}</dd><dt>Nama asli (referensi sumber)</dt><dd>{product.nama_asli || product.nama}</dd><dt>Harga jual sumber</dt><dd>{money(product.harga_jual)}</dd></dl>
      </div> : <>
        <Field label="SKU varian"><input name="sku" required maxLength={128} className={inputClass} /></Field>
        <Field label="SKU induk (opsional)"><input name="sku_induk" maxLength={128} className={inputClass} /></Field>
        <Field label="URL gambar (opsional)"><input name="gambar_url" type="url" pattern="https?://.*" maxLength={2048} className={inputClass} /></Field>
        <Field label="Harga jual"><input name="harga_jual" defaultValue="0" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required className={inputClass} /></Field>
      </>}
      <Field label="Nama produk ringkas"><input name="nama" defaultValue={product?.nama ?? ""} autoFocus required maxLength={255} className={inputClass} /></Field>
      <Field label="Jenis produk"><select name="jenis" required defaultValue={product?.jenis ?? ""} className={inputClass}><option value="">Pilih jenis</option><option value="kayu">Kayu</option><option value="non_kayu">Non-Kayu</option></select></Field>
      <Field label="Biaya acuan / modal"><input name="biaya_acuan" defaultValue={product?.biaya_acuan ?? "0"} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" required className={inputClass} /></Field>
      <fieldset className="sm:col-span-2 grid gap-3 rounded border p-3"><legend className="px-1 text-sm font-medium">Varian dinamis</legend>
        {variants.map((row, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Field label={`Kategori varian ${index + 1}`}><input value={row.kategori} onChange={event => variant(index, "kategori", event.target.value)} required maxLength={128} className={inputClass} /></Field>
          <Field label={`Nilai varian ${index + 1}`}><input value={row.nilai} onChange={event => variant(index, "nilai", event.target.value)} required maxLength={255} className={inputClass} /></Field>
          <Button aria-label={`Hapus varian ${index + 1}`} onClick={() => setVariants(rows => rows.filter((_, i) => i !== index))}>Hapus</Button>
        </div>)}
        <div><Button onClick={() => setVariants(rows => [...rows, { kategori: "", nilai: "" }])}>Tambah varian</Button></div>
      </fieldset>
      <div className="sm:col-span-2"><ErrorMessage error={localError ?? action.error} /><div className="flex flex-wrap gap-2"><Button type="submit" disabled={action.isPending}>{action.isPending ? "Menyimpan…" : "Simpan sebagai Master"}</Button><Button disabled={action.isPending} onClick={onClose}>Batal</Button></div></div>
    </form>
  </Panel>;
}

export default function ProductMaster() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const data = useResource<Product>("/produk", offset, search);
  return <>
    {editing !== undefined && <ProductForm key={editing?.id ?? "new"} product={editing} onClose={() => setEditing(undefined)} />}
    <Panel title="Master produk">
      <p className="mb-3 text-sm text-stone-600">Sync dan Import membuat draf berdasarkan SKU varian. Nama asli dan metadata sumber tetap menjadi referensi.</p>
      <div className="mb-4 flex flex-wrap items-end gap-3"><Field label="Cari nama atau SKU"><input value={search} maxLength={128} onChange={event => { setSearch(event.target.value); setOffset(0); }} className={inputClass} /></Field><Button onClick={() => setEditing(null)}>Tambah produk manual</Button></div>
      <ErrorMessage error={data.error} />
      {data.isLoading ? <Loading /> : !data.data?.rows.length ? <Empty>Belum ada produk. Tarik pesanan atau import file dengan SKU varian.</Empty> : <Table headers={["Foto", "Produk / SKU", "Varian", "Harga jual / modal", "Status", "Pemetaan"]}>
        {data.data.rows.map(product => <tr key={product.id} className="border-b align-top">
          <td className="px-3 py-2"><Thumbnail key={product.gambar_url} url={product.gambar_url} name={product.nama} /></td>
          <td className="max-w-sm px-3 py-2 break-words"><strong>{product.nama}</strong><div className="text-stone-600">{product.sku}</div><div className="text-xs">Induk: {product.sku_induk ?? "—"}</div><div className="text-xs text-stone-500">{product.nama_asli}</div></td>
          <td className="px-3 py-2">{product.varian_list?.map((row, index) => <div key={index}>{row.kategori}: {row.nilai}</div>)}</td>
          <td className="px-3 py-2 whitespace-nowrap">Jual: {money(product.harga_jual)}<br />Modal: {money(product.biaya_acuan)}</td>
          <td className="px-3 py-2">{product.status === "draf" ? "Draf · perlu pemetaan" : product.aktif ? "Master" : "Master · Nonaktif"}<br />{product.jenis === "kayu" ? "Kayu" : product.jenis === "non_kayu" ? "Non-Kayu" : "Jenis belum ditetapkan"}</td>
          <td className="px-3 py-2"><Button onClick={() => setEditing(product)} aria-label={`Edit produk ${product.sku}`}>Edit / Petakan</Button><MasterActions resource="produk" id={product.id} nama={product.sku} aktif={product.aktif} /></td>
        </tr>)}
      </Table>}
      <Pager offset={offset} total={data.data?.total ?? 0} onChange={setOffset} />
    </Panel>
  </>;
}
