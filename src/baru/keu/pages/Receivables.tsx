import { useState } from "react";
import { money, today, useKeuAction, useResource } from "../api";
import type { Receivable } from "../types";
import { BookNotice, useBook } from "../components/BookSettings";
import { Button, Empty, ErrorMessage, Field, Heading, inputClass, Pager, Panel, Table } from "../components/UI";

export default function Receivables() {
  const book=useBook();
  return <><Heading title="Piutang Pengiriman & Escrow">Dikirim dicatat sebagai piutang pengiriman. Selesai dipindahkan ke escrow; pencairan dilakukan melalui settlement teralokasi.</Heading><BookNotice />{book.data?.aktif&&<Workspace />}</>;
}
function Workspace() {
  const [offset,setOffset]=useState(0), rows=useResource<Receivable>("/piutang",offset);
  return <Panel title="Rincian Piutang per Pesanan"><ErrorMessage error={rows.error} />{!rows.data?.rows.length?<Empty />:<Table headers={["Pesanan", "Status sumber", "Dalam Pengiriman", "Escrow", "Rekonsiliasi"]}>{rows.data.rows.map(row=><tr key={row.id} className="border-b"><td className="px-3 py-2">{row.nomor}</td><td>{row.status_sumber}</td><td>{money(row.pengiriman)}</td><td>{money(row.escrow)}</td><td><Reconcile row={row} /></td></tr>)}</Table>}<Pager offset={offset} total={rows.data?.total??0} onChange={setOffset} /></Panel>;
}
function Reconcile({row}:{row:Receivable}) {
  const [open,setOpen]=useState(false),[reference,setReference]=useState(()=>crypto.randomUUID());const action=useKeuAction();
  return <>{open?<form className="grid gap-2" onSubmit={event=>{event.preventDefault();void action.mutateAsync({path:"/piutang/rekonsiliasi",body:{...Object.fromEntries(new FormData(event.currentTarget)),pesanan_id:row.id,referensi:reference}}).then(()=>{setReference(crypto.randomUUID());setOpen(false);}).catch(()=>{});}}><Field label={`Tanggal piutang ${row.nomor}`}><input type="date" name="tanggal" required defaultValue={today()} className={inputClass} /></Field><Field label={`Posisi piutang ${row.nomor}`}><select name="posisi" className={inputClass}><option value="pengiriman">Dalam Pengiriman</option><option value="escrow">Escrow / Selesai</option></select></Field><Button type="submit" disabled={action.isPending}>Konfirmasi Piutang</Button><Button onClick={()=>setOpen(false)}>Tutup</Button><ErrorMessage error={action.error} /></form>:<Button onClick={()=>setOpen(true)}>Rekonsiliasi {row.nomor}</Button>}</>;
}
