import { useState } from "react";
import { useKeuAction, useResource } from "../api";
import type { Vendor } from "../types";
import { Button, Empty, ErrorMessage, Field, inputClass, Loading, Pager, Panel, Table } from "./UI";

export default function VendorMaster() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Vendor | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const data = useResource<Vendor>("/vendor", offset, search);
  const action = useKeuAction<Vendor>();

  function open(vendor: Vendor | "new") {
    action.reset();
    setNotice("");
    setEditing(vendor);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const current = editing !== "new" ? editing : null;
    const body = { ...values, kode: values.kode.trim() || null };
    try {
      await action.mutateAsync({ path: current ? `/vendor/${current.id}` : "/vendor", method: current ? "PATCH" : "POST", body });
      setEditing(null);
      setNotice("Vendor berhasil disimpan.");
    } catch { /* Keep the form and show the backend error. */ }
  }

  async function toggle(vendor: Vendor) {
    setNotice("");
    try {
      await action.mutateAsync(vendor.aktif
        ? { path: `/vendor/${vendor.id}`, method: "DELETE" }
        : { path: `/vendor/${vendor.id}`, method: "PATCH", body: { aktif: true } });
      setNotice(vendor.aktif ? `${vendor.nama} dinonaktifkan. Riwayat alokasi tetap tersimpan.` : `${vendor.nama} diaktifkan kembali.`);
    } catch { /* The mutation error is shown below. */ }
  }

  const current = editing && editing !== "new" ? editing : null;
  return <Panel title="Master vendor">
    <p className="mb-3 text-sm text-stone-600">Tambah tukang kayu dan supplier sesuai kebutuhan. Hanya vendor aktif yang tersedia untuk alokasi baru di Produksi.</p>
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <Field label="Cari vendor"><input value={search} maxLength={128} placeholder="Nama, kode, kontak, atau alamat" className={inputClass} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></Field>
      <Button disabled={action.isPending} onClick={() => open("new")}>+ Tambah Vendor</Button>
    </div>
    <ErrorMessage error={data.error ?? action.error} />
    {notice && <p role="status" className="mb-3 text-sm text-emerald-800">{notice}</p>}
    {editing && <form key={current?.id ?? "new"} aria-label={current ? "Edit vendor" : "Tambah vendor"} onSubmit={event => void save(event)} className="mb-5 grid gap-3 rounded-lg border bg-stone-50 p-4 sm:grid-cols-2">
      <Field label="Kode vendor"><input name="kode" maxLength={128} required={!!current} defaultValue={current?.kode ?? ""} placeholder="Kosongkan untuk kode otomatis" className={inputClass} /></Field>
      <Field label="Nama vendor"><input name="nama" minLength={1} maxLength={255} required defaultValue={current?.nama ?? ""} className={inputClass} /></Field>
      <Field label="Tipe vendor"><select name="tipe" required defaultValue={current?.tipe ?? "kayu"} className={inputClass}><option value="kayu">Kayu / Tukang kayu</option><option value="non_kayu">Non-Kayu / Supplier</option></select></Field>
      <Field label="Kontak / WhatsApp"><input name="kontak" maxLength={255} defaultValue={current?.kontak ?? ""} className={inputClass} /></Field>
      <Field label="Alamat vendor"><textarea name="alamat" maxLength={2000} defaultValue={current?.alamat ?? ""} className={inputClass} /></Field>
      <Field label="Keterangan vendor"><textarea name="keterangan" maxLength={2000} defaultValue={current?.keterangan ?? ""} className={inputClass} /></Field>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={action.isPending}>{action.isPending ? "Menyimpan…" : "Simpan vendor"}</Button><Button disabled={action.isPending} onClick={() => { setEditing(null); action.reset(); }}>Batal</Button></div>
    </form>}
    {data.isLoading ? <Loading /> : !data.data?.rows.length ? <Empty /> : <Table headers={["Kode", "Nama vendor", "Tipe", "Kontak / WA", "Alamat / keterangan", "Status", "Aksi"]}>
      {data.data.rows.map(vendor => <tr key={vendor.id} className="border-b">
        <td className="px-3 py-2">{vendor.kode}</td><td className="px-3 py-2">{vendor.nama}</td><td className="px-3 py-2">{vendor.tipe === "kayu" ? "Tukang kayu" : "Supplier"}</td><td className="px-3 py-2">{vendor.kontak || "—"}</td>
        <td className="max-w-xs whitespace-pre-wrap px-3 py-2">{[vendor.alamat, vendor.keterangan].filter(Boolean).join("\n") || "—"}</td><td className="px-3 py-2">{vendor.aktif ? "Aktif" : "Nonaktif"}</td>
        <td className="px-3 py-2"><div className="flex flex-wrap gap-2"><Button disabled={action.isPending} aria-label={`Edit ${vendor.nama}`} onClick={() => open(vendor)}>Edit</Button><Button disabled={action.isPending || !!editing} aria-label={`${vendor.aktif ? "Nonaktifkan" : "Aktifkan"} ${vendor.nama}`} onClick={() => void toggle(vendor)}>{vendor.aktif ? "Nonaktifkan" : "Aktifkan"}</Button></div></td>
      </tr>)}
    </Table>}
    <Pager offset={offset} total={data.data?.total ?? 0} onChange={setOffset} />
  </Panel>;
}
