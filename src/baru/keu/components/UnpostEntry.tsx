import { useState } from "react";
import { useKeuAction } from "../api";
import { Button, ErrorMessage, Field, inputClass } from "./UI";

export default function UnpostEntry({ id, resource }: { id: string; resource: "transaksi" | "settlement" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const action = useKeuAction();
  return <div className="min-w-48">
    <Button onClick={() => { action.reset(); setOpen(true); }}>Batalkan Post</Button>
    {open && <form className="mt-3 grid gap-2 rounded-lg border border-red-200 bg-red-50 p-3" onSubmit={event => {
      event.preventDefault();
      if (reason.trim().length < 3) return;
      void action.mutateAsync({ path: `/${resource}/${id}/unpost`, body: { alasan: reason.trim() } })
        .then(() => { setReason(""); setOpen(false); }).catch(() => {});
    }}>
      <p className="text-sm">Pembatalan mengeluarkan jurnal dari saldo kas. Settlement dan jurnal terkait ikut dibatalkan. Riwayat asli tetap tersimpan dan tidak dapat diposting ulang. Periode tutup buku tidak dapat dibatalkan.</p>
      <Field label="Alasan pembatalan"><textarea required minLength={3} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} className={inputClass} /></Field>
      <ErrorMessage error={action.error} />
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={action.isPending || reason.trim().length < 3}>Konfirmasi Batal Post</Button><Button disabled={action.isPending} onClick={() => { setOpen(false); action.reset(); }}>Tutup</Button></div>
    </form>}
  </div>;
}
