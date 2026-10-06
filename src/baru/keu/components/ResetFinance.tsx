import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useKeuAction } from "../api";
import { Button, ErrorMessage, Field, inputClass, Panel } from "./UI";

interface Preview { challenge_id: string; token: string; expires_at: string; counts: Record<string, number> }
const labels: Record<string, string> = { keu_pesanan: "Pesanan internal", keu_item: "Item pesanan", keu_alokasi_vendor: "Riwayat pengerjaan vendor", keu_settlement: "Settlement", keu_alokasi_settlement: "Alokasi settlement", keu_transaksi: "Transaksi kas / bank", keu_impor: "Riwayat impor", keu_masukan: "Data sinkronisasi / impor", keu_cursor: "Posisi sinkronisasi" };

export default function ResetFinance() {
  const { user } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [keyword, setKeyword] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const prepare = useKeuAction<Preview>();
  const execute = useKeuAction();
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  if (user?.role !== "owner") return null;
  function close() { setOpen(false); setPassword(""); setKeyword(""); setPreview(null); }
  async function start() {
    setOpen(true); setStage(1); setNotice(""); setKeyword(""); setPassword(""); setPreview(null); execute.reset();
    try { setPreview(await prepare.mutateAsync({ path: "/reset/pratinjau" })); } catch { /* Shown in the modal. */ }
  }
  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || keyword !== "RESET-KEUANGAN") return;
    try {
      await execute.mutateAsync({ path: "/reset", body: { challenge_id: preview.challenge_id, token: preview.token, konfirmasi: keyword, password } });
      close(); setNotice("Data keuangan keu berhasil direset. Master data dan pencatatan lama tetap tersimpan.");
    } catch { /* Preserve the confirmation and display the error. */ }
  }
  const busy = prepare.isPending || execute.isPending;
  return <Panel title="Reset Data Keuangan">
    <p className="mb-3 text-sm text-red-800">Menghapus pesanan internal, transaksi kas/bank, settlement, riwayat pengerjaan vendor, serta data impor/sinkronisasi keu. Master dan pencatatan lama tetap dipertahankan. Penghapusan ini tidak dapat dibatalkan.</p>
    <Button disabled={busy} onClick={() => void start()}>Reset Data Keuangan</Button>
    {notice && <p role="status" className="mt-3">{notice}</p>}
    <dialog ref={dialog} aria-labelledby="reset-title" onCancel={event => { if (busy) event.preventDefault(); else close(); }} className="m-auto max-h-[90vh] w-[min(95vw,38rem)] overflow-y-auto rounded-xl border p-5 backdrop:bg-black/50">
      <h2 id="reset-title" className="mb-3 text-lg font-semibold">Konfirmasi {stage}/2: Reset Data Keuangan</h2>
      <ErrorMessage error={prepare.error ?? execute.error} />
      {stage === 1 ? <>
        <p className="mb-3">Periksa data yang akan dihapus. Produk, vendor, pelanggan, akun, saluran, dan audit tetap tersimpan.</p>
        {prepare.isPending ? <p role="status">Menghitung data…</p> : preview && <ul className="mb-4 space-y-1">{Object.entries(preview.counts).map(([key, count]) => <li key={key}>{labels[key] ?? key}: {count}</li>)}</ul>}
        <div className="flex flex-wrap gap-2"><Button disabled={!preview || busy} onClick={() => setStage(2)}>Lanjutkan konfirmasi</Button><Button disabled={busy} onClick={() => void start()}>Perbarui pratinjau</Button><Button disabled={busy} onClick={close}>Batal reset</Button></div>
      </> : <form onSubmit={event => void reset(event)} className="grid gap-3">
        <p>Ketik RESET-KEUANGAN dan masukkan password owner. Konfirmasi berlaku 5 menit; perubahan data memerlukan pratinjau ulang.</p>
        <Field label="Kata kunci reset"><input value={keyword} onChange={event => setKeyword(event.target.value)} required autoComplete="off" className={inputClass} /></Field>
        <Field label="Password owner"><input type="password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={255} autoComplete="current-password" className={inputClass} /></Field>
        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy || keyword !== "RESET-KEUANGAN" || !password}>{execute.isPending ? "Mereset…" : "Reset permanen"}</Button><Button disabled={busy} onClick={() => void start()}>Perbarui pratinjau</Button><Button disabled={busy} onClick={close}>Batal reset</Button></div>
      </form>}
    </dialog>
  </Panel>;
}
