import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, unggah } from "../../../lib/api";
import { useChoices, useKeuAction, useResource } from "../api";
import type { Channel, ImportBatch } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

export default function Imports() {
  const [kind, setKind] = useState("order");
  const [offset, setOffset] = useState(0);
  const [preview, setPreview] = useState<ImportBatch | null>(null);
  const channels = useChoices<Channel>("/saluran");
  const batches = useResource<ImportBatch>("/impor", offset);
  const client = useQueryClient();
  const upload = useMutation({ mutationFn: (form: FormData) => unggah<ImportBatch>("/keu/impor/pratinjau", form), onSuccess: async value => { setPreview(value); await client.invalidateQueries({ queryKey: ["keu"] }); } });
  const action = useKeuAction<ImportBatch>();
  return <><Heading title="Import">Unggah CSV atau XLSX sesuai template, periksa setiap baris, lalu terapkan sebagai draf.</Heading><ErrorMessage error={channels.error ?? batches.error ?? upload.error ?? action.error} />
    <Panel title="Pratinjau file"><form className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); setPreview(null); upload.mutate(new FormData(event.currentTarget)); }}><Field label="Jenis impor"><select name="jenis" value={kind} onChange={event => { setKind(event.target.value); setPreview(null); }} className={inputClass}><option value="order">Pesanan manual</option><option value="biaya">Biaya operasional</option><option value="settlement">Settlement</option></select></Field><Field label="Saluran impor"><select required name="saluran_id" className={inputClass}><option value="">Pilih saluran</option>{channels.data?.filter(c => c.aktif && (kind === "settlement" ? c.sistem !== "store" : c.sistem === "manual")).map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></Field><Field label="File CSV atau Excel"><input name="file" type="file" accept=".csv,.xlsx" required className={inputClass} /></Field><div className="flex items-center gap-3"><a className="text-sm text-emerald-800 underline" href={apiUrl(`/keu/impor/template?jenis=${kind}`)}>Unduh template</a><Button type="submit" disabled={upload.isPending || action.isPending}>Pratinjau</Button></div></form><p className="mt-3 text-sm text-stone-600">Maksimal 5 MB dan 10.000 baris. Nominal memakai titik desimal. Formula Excel ditolak. File yang sama tidak diterapkan dua kali.</p></Panel>
    {preview && <Panel title={`Hasil pratinjau: ${preview.nama_file}`}><p className="mb-3 text-sm">Status: {preview.status} · {preview.rows.length} baris</p><Table headers={["Baris", "Referensi", "Status", "Kesalahan"]}>{preview.rows.map(row => <tr key={row.id} className="border-b"><td className="px-3 py-2">{row.nomor_baris}</td><td>{row.sumber_ref}</td><td>{row.status}</td><td>{row.kesalahan.map(e => e.pesan).join("; ") || "Valid"}</td></tr>)}</Table><div className="mt-4"><Button disabled={preview.status !== "valid" || action.isPending || upload.isPending} onClick={() => { void action.mutateAsync({ path: `/impor/${preview.id}/terapkan` }).then(setPreview).catch(() => {}); }}>Terapkan impor</Button></div></Panel>}
    <Panel title="Riwayat impor">{batches.isLoading ? <Loading /> : !batches.data?.rows.length ? <Empty /> : <Table headers={["File", "Jenis", "Status", "Detail"]}>{batches.data.rows.map(batch => <tr key={batch.id} className="border-b"><td className="px-3 py-2">{batch.nama_file}</td><td>{batch.jenis}</td><td>{batch.status}</td><td><Button disabled={action.isPending} onClick={() => { void action.mutateAsync({ path: `/impor/${batch.id}`, method: "GET" }).then(setPreview).catch(() => {}); }}>Lihat pratinjau</Button></td></tr>)}</Table>}<Pager offset={offset} total={batches.data?.total ?? 0} onChange={setOffset} /></Panel>
  </>;
}
