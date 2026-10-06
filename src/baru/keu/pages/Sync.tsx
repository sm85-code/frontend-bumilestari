import { useState } from "react";
import { query } from "../../../lib/api";
import { useChoices, useKeuAction, useResource } from "../api";
import type { Channel, Inbox } from "../types";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Loading, Pager, Panel, Table } from "../components/UI";

type Position = { setelah_at: string; setelah_ref: string };
type PullResult = { dibaca: number; terproses: number; gagal: number; ada_lanjutan: boolean; halaman_berikutnya: Position | null };

function DateRangePull({ channel, entity }: { channel: Channel; entity: "order" | "settlement" }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const action = useKeuAction<PullResult>();
  const label = entity === "order" ? "pesanan" : "settlement";
  const title = entity === "order" ? "Pesanan" : "Settlement";
  function reset() { setPosition(null); setResult(null); setError(null); action.reset(); }
  async function pull(next: boolean) {
    setError(null);
    if (!start || !end || start > end) { setError(new Error("Isi rentang tanggal yang valid; tanggal awal tidak boleh melebihi tanggal akhir.")); return; }
    if (next && !position) return;
    try {
      const values = await action.mutateAsync({ path: `/saluran/${encodeURIComponent(channel.id)}/tarik${query({ entitas: entity, tanggal_awal: start, tanggal_akhir: end, ...(next ? position : {}) })}` });
      setResult(values); setPosition(values.halaman_berikutnya);
    } catch (cause) { setError(cause); }
  }
  return <section className="rounded-lg border bg-stone-50 p-3" aria-label={`${title} ${channel.nama}`}>
    <h3 className="mb-2 font-medium">{title}</h3>
    <p className="mb-3 text-sm text-stone-600">{entity === "order" ? "Berdasarkan tanggal pesanan dibuat." : "Berdasarkan tanggal dana cair."} Kedua tanggal termasuk dalam penarikan, zona waktu WIB.</p>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); void pull(false); }}>
      <Field label={`Tanggal awal ${label}`}><input type="date" required value={start} max={end || undefined} disabled={action.isPending} onChange={event => { setStart(event.target.value); reset(); }} className={inputClass} /></Field>
      <Field label={`Tanggal akhir ${label}`}><input type="date" required value={end} min={start || undefined} disabled={action.isPending} onChange={event => { setEnd(event.target.value); reset(); }} className={inputClass} /></Field>
      <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={action.isPending || !start || !end || start > end}>{action.isPending ? "Menarik…" : `Tarik ${label}`}</Button>{position && <Button disabled={action.isPending} onClick={() => void pull(true)}>Tarik 100 berikutnya ({label})</Button>}</div>
    </form>
    <ErrorMessage error={error} />
    {result && <p role="status" className="mt-3 text-sm">Hasil batch {start}–{end}: dibaca {result.dibaca}, terproses {result.terproses}, gagal {result.gagal}. {result.ada_lanjutan ? "Masih ada data; gunakan tombol Tarik 100 berikutnya." : "Penarikan rentang selesai."}</p>}
  </section>;
}

export default function Sync() {
  const [offset, setOffset] = useState(0);
  const channels = useChoices<Channel>("/saluran");
  const inbox = useResource<Inbox>("/masukan", offset);
  const retry = useKeuAction();
  const sources = channels.data?.filter(channel => channel.aktif && channel.sistem !== "manual") ?? [];
  return <>
    <Heading title="Sinkronisasi">Tarik data Store dan ERP ke tenant BUMI. Pilih rentang tanggal terpisah untuk pesanan dan settlement.</Heading>
    <ErrorMessage error={channels.error ?? inbox.error ?? retry.error} />
    <Panel title="Saluran sumber">
      {channels.isLoading ? <Loading /> : !sources.length ? <Empty>Tambahkan saluran Store atau akun ERP di Pengaturan.</Empty> : sources.map(channel => <article key={channel.id} className="mb-4 rounded-xl border p-3">
        <h2 className="font-semibold">{channel.nama}</h2><p className="mb-3 text-sm text-stone-600">{channel.sistem} · {channel.akun_ref}</p>
        <div className="grid gap-3 lg:grid-cols-2"><DateRangePull channel={channel} entity="order" />{channel.sistem === "marketplace_erp" && <DateRangePull channel={channel} entity="settlement" />}</div>
      </article>)}
      <p className="mt-3 text-sm text-stone-600">Maksimal 100 data per batch. Penarikan ulang rentang tidak menggandakan data yang sama. Item sumber perlu dipetakan ke produk lokal; settlement tetap draf sampai direkonsiliasi.</p>
    </Panel>
    <Panel title="Antrian masukan">
      {inbox.isLoading ? <Loading /> : !inbox.data?.rows.length ? <Empty /> : <Table headers={["Entitas", "Referensi", "Status", "Kesalahan", "Tindakan"]}>{inbox.data.rows.map(row => <tr key={row.id} className="border-b"><td className="px-3 py-2">{row.entitas}</td><td>{row.sumber_ref}</td><td>{row.status}</td><td>{row.kesalahan.map(error => error.pesan).join("; ") || "—"}</td><td>{row.status === "gagal" && !row.impor_id && <Button disabled={retry.isPending} onClick={() => retry.mutate({ path: `/masukan/${row.id}/ulang` })}>Coba ulang</Button>}</td></tr>)}</Table>}
      <Pager offset={offset} total={inbox.data?.total ?? 0} onChange={setOffset} />
    </Panel>
  </>;
}
