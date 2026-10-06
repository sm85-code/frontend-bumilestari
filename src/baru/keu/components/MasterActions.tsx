import { useState } from "react";
import { useKeuAction } from "../api";
import { Button, ErrorMessage } from "./UI";

export default function MasterActions({ resource, id, nama, aktif, showStatus = true }: { showStatus?: boolean; resource: string; id: string; nama: string; aktif: boolean }) {
  const action = useKeuAction();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  async function status() {
    try {
      await action.mutateAsync({ path: `/master/${resource}/${encodeURIComponent(id)}/status`, method: "PATCH", body: { aktif: !aktif } });
      setNotice(aktif ? "Dinonaktifkan; riwayat tetap tersimpan." : "Diaktifkan.");
    } catch { /* The backend error remains visible. */ }
  }
  async function remove() {
    try { await action.mutateAsync({ path: `/master/${resource}/${encodeURIComponent(id)}`, method: "DELETE" }); } catch { /* Keep confirmation and offer soft deletion. */ }
  }
  return <div className="mt-2 grid gap-2">
    <div className="flex flex-wrap gap-2">{showStatus && <Button disabled={action.isPending} aria-label={`${aktif ? "Nonaktifkan" : "Aktifkan"} ${resource} ${nama}`} onClick={() => void status()}>{aktif ? "Nonaktifkan" : "Aktifkan"}</Button>}<Button disabled={action.isPending} aria-label={`Hapus ${resource} ${nama}`} onClick={() => { action.reset(); setConfirm(true); }}>Hapus</Button></div>
    {confirm && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm"><p>Hapus permanen {nama}? Data yang masih terkait akan ditolak. Pilih Nonaktifkan untuk mempertahankan riwayat.</p><div className="mt-2 flex gap-2"><Button disabled={action.isPending} onClick={() => void remove()}>Konfirmasi hapus</Button><Button disabled={action.isPending} onClick={() => { setConfirm(false); action.reset(); }}>Batal hapus</Button></div></div>}
    <ErrorMessage error={action.error} />{notice && <p role="status" className="text-sm">{notice}</p>}
  </div>;
}
