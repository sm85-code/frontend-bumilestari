import { useState } from "react";
import { useChoices, useKeuAction, useResource } from "../api";
import type { Channel, Inbox } from "../types";
import { Button, Empty, ErrorMessage, Heading, Loading, Pager, Panel, Table } from "../components/UI";

export default function Sync() {
  const [offset, setOffset] = useState(0);
  const channels = useChoices<Channel>("/saluran");
  const inbox = useResource<Inbox>("/masukan", offset);
  const action = useKeuAction<{ dibaca: number; terproses: number; gagal: number; ada_lanjutan: boolean }>();
  const retry = useKeuAction();
  return <><Heading title="Sinkronisasi">Tarik data Store dan ERP ke tenant BUMI. Data sumber dibaca tanpa mengubah pesanan atau pembayaran.</Heading><ErrorMessage error={channels.error ?? inbox.error ?? action.error ?? retry.error} />
    <Panel title="Saluran sumber">{channels.isLoading ? <Loading /> : !channels.data?.some(c => c.aktif && c.sistem !== "manual") ? <Empty>Tambahkan saluran Store atau akun ERP di Pengaturan.</Empty> : channels.data.filter(c => c.aktif && c.sistem !== "manual").map(c => <div key={c.id} className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border p-3"><div className="grow"><strong>{c.nama}</strong><p className="text-sm text-stone-600">{c.sistem} · {c.akun_ref}</p></div><Button disabled={action.isPending} onClick={() => action.mutate({ path: `/saluran/${c.id}/tarik?entitas=order` })}>Tarik pesanan</Button>{c.sistem === "marketplace_erp" && <Button disabled={action.isPending} onClick={() => action.mutate({ path: `/saluran/${c.id}/tarik?entitas=settlement` })}>Tarik settlement</Button>}</div>)}{action.data && <p role="status" className="mt-3 text-sm">Dibaca: {action.data.dibaca} · Terproses: {action.data.terproses} · Gagal: {action.data.gagal}. {action.data.ada_lanjutan ? "Masih ada data berikutnya; jalankan penarikan lagi." : "Penarikan selesai."}</p>}<p className="mt-3 text-sm text-stone-600">Setiap penarikan maksimal 100 data dengan cursor dan deduplikasi. Item sumber perlu dipetakan ke produk lokal; settlement tetap draf sampai direkonsiliasi.</p></Panel>
    <Panel title="Antrian masukan">{inbox.isLoading ? <Loading /> : !inbox.data?.rows.length ? <Empty /> : <Table headers={["Entitas", "Referensi", "Status", "Kesalahan", "Tindakan"]}>{inbox.data.rows.map(row => <tr key={row.id} className="border-b"><td className="px-3 py-2">{row.entitas}</td><td>{row.sumber_ref}</td><td>{row.status}</td><td>{row.kesalahan.map(e => e.pesan).join("; ") || "—"}</td><td>{row.status === "gagal" && !row.impor_id && <Button disabled={retry.isPending} onClick={() => retry.mutate({ path: `/masukan/${row.id}/ulang` })}>Coba ulang</Button>}</td></tr>)}</Table>}<Pager offset={offset} total={inbox.data?.total ?? 0} onChange={setOffset} /></Panel>
  </>;
}
