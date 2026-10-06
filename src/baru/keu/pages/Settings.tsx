import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { keu, money, useKeuAction, useResource } from "../api";
import type { Slot } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

type Resource = "produk" | "akun" | "pelanggan" | "saluran";
type FieldConfig = { name: string; label: string; options?: string[]; optional?: boolean };
const configs: Record<Resource, FieldConfig[]> = {
  produk: [{ name: "sku", label: "SKU" }, { name: "nama", label: "Nama produk" }, { name: "jenis", label: "Jenis", options: ["kayu", "non_kayu"] }, { name: "biaya_acuan", label: "Biaya acuan (contoh 125000.00)" }],
  akun: [{ name: "kode", label: "Kode akun" }, { name: "nama", label: "Nama akun" }, { name: "jenis", label: "Jenis", options: ["kas", "bank", "ewallet"] }, { name: "saldo_awal", label: "Saldo awal (contoh 125000.00)" }],
  pelanggan: [{ name: "nama", label: "Nama pelanggan" }, { name: "segmen", label: "Segmen", options: ["", "umkm", "reseller"], optional: true }, { name: "kontak", label: "Kontak", optional: true }],
  saluran: [{ name: "nama", label: "Nama saluran" }, { name: "sistem", label: "Sumber", options: ["manual", "store", "marketplace_erp"] }, { name: "akun_ref", label: "Referensi akun" }],
};
function Master({ resource }: { resource: Resource }) {
  const [offset, setOffset] = useState(0);
  const data = useResource<Record<string, string | boolean | null>>(`/${resource}`, offset);
  const action = useKeuAction();
  const sources = useQuery({ queryKey: ["keu", "sumber"], queryFn: () => keu<{ erp: { id: string; nama: string }[]; erp_tersedia: boolean; store_tersedia: boolean }>("/sumber"), enabled: resource === "saluran" });
  const [source, setSource] = useState("manual");
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const body: Record<string, unknown> = { ...values };
    if (resource === "pelanggan") body.segmen = values.segmen || null;
    if (resource === "saluran") { body.aktif = true; if (source === "store") body.akun_ref = "store"; }
    try { await action.mutateAsync({ path: `/${resource}`, body }); form.reset(); setSource("manual"); } catch { /* The mutation error is shown below. */ }
  }
  return <Panel title={`Master ${resource}`}><ErrorMessage error={data.error ?? action.error ?? sources.error} /><form onSubmit={event => void save(event)} className="mb-5 grid gap-3 sm:grid-cols-2">
    {configs[resource].map(field => <Field key={field.name} label={field.label}>{resource === "saluran" && field.name === "akun_ref" && source === "marketplace_erp" ? <select name="akun_ref" className={inputClass} required><option value="">Pilih akun ERP</option>{sources.data?.erp.map(row => <option key={row.id} value={row.id}>{row.nama}</option>)}</select> : resource === "saluran" && field.name === "akun_ref" && source === "store" ? <input name="akun_ref" className={inputClass} readOnly value="store" /> : field.options ? <select name={field.name} className={inputClass} required={!field.optional} value={field.name === "sistem" ? source : undefined} onChange={field.name === "sistem" ? event => setSource(event.target.value) : undefined}>{field.options.map(value => <option key={value} value={value}>{value || "Belum diklasifikasikan"}</option>)}</select> : <input name={field.name} required={!field.optional} maxLength={field.name === "kode" ? 64 : field.name === "sku" || field.name === "akun_ref" || (field.name === "nama" && (resource === "akun" || resource === "saluran")) ? 128 : 255} className={inputClass} defaultValue={field.name === "saldo_awal" || field.name === "biaya_acuan" ? "0" : undefined} />}</Field>)}
    <div className="sm:col-span-2"><Button type="submit" disabled={action.isPending || (resource === "saluran" && source === "marketplace_erp" && !sources.data?.erp_tersedia) || (resource === "saluran" && source === "store" && !sources.data?.store_tersedia)}>{action.isPending ? "Menyimpan…" : "Simpan"}</Button></div></form>
    {data.isLoading ? <Loading /> : !data.data?.rows.length ? <Empty /> : <Table headers={["Nama", "Kode / sumber", "Rincian"]}>{data.data.rows.map(row => <tr key={String(row.id)} className="border-b"><td className="px-3 py-2">{String(row.nama)}</td><td>{String(row.sku ?? row.kode ?? row.sistem ?? row.segmen ?? "—")}</td><td>{row.biaya_acuan ? money(String(row.biaya_acuan)) : row.saldo_awal ? money(String(row.saldo_awal)) : String(row.kontak ?? row.akun_ref ?? "—")}</td></tr>)}</Table>}
    <Pager offset={offset} total={data.data?.total ?? 0} onChange={setOffset} /></Panel>;
}
function VendorSlot({ slot }: { slot: Slot }) {
  const action = useKeuAction();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = { ...Object.fromEntries(new FormData(event.currentTarget)), jenis: slot.jenis };
    try { await action.mutateAsync({ path: `/vendor-slot/${slot.kode}`, method: "PUT", body }); } catch { /* The mutation error is shown below. */ }
  }
  return <form onSubmit={event => void save(event)} className="rounded-lg border p-3"><p className="mb-2 font-medium">{slot.kode} · {slot.jenis === "tukang_kayu" ? "Tukang kayu" : "Supplier"}</p><div className="grid gap-2"><Field label={`Nama ${slot.kode}`}><input name="nama" required maxLength={255} defaultValue={slot.vendor?.nama ?? ""} className={inputClass} /></Field><Field label={`Kontak ${slot.kode}`}><input name="kontak" maxLength={255} defaultValue={slot.vendor?.kontak ?? ""} className={inputClass} /></Field><Button type="submit" disabled={action.isPending}>Simpan {slot.kode}</Button><ErrorMessage error={action.error} /></div></form>;
}
export default function Settings() {
  const [resource, setResource] = useState<Resource>("produk");
  const slots = useQuery({ queryKey: ["keu", "vendor-slot"], queryFn: () => keu<Slot[]>("/vendor-slot") });
  return <><Heading title="Pengaturan">Master keuangan dan vendor. Slot serta nama vendor dibaca dari database.</Heading><Panel title="Tukang kayu dan supplier"><ErrorMessage error={slots.error} />{slots.isLoading ? <Loading /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{slots.data?.map(slot => <VendorSlot key={`${slot.kode}:${slot.vendor_id ?? "empty"}`} slot={slot} />)}</div>}</Panel><div role="tablist" aria-label="Master data" className="mb-4 flex flex-wrap gap-2">{Object.keys(configs).map(key => <button role="tab" aria-selected={resource === key} key={key} className={inputClass} onClick={() => setResource(key as Resource)}>{key}</button>)}</div><Master key={resource} resource={resource} /></>;
}
