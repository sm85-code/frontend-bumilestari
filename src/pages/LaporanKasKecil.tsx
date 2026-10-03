import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Baris, Card, ErrorBox, Field, Input, Memuat } from "../components/ui";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { api, query } from "../lib/api";
import { bersihkanAngka, bulanIni, num, rp, tanggal } from "../lib/format";
import type { LaporanKasKecil } from "../lib/types";

export default function LaporanKasKecilPage() {
  const { user } = useAuth();
  const [periode, setPeriode] = useState(bulanIni());
  const [fisik, setFisik] = useState("");
  const saldoFisik = bersihkanAngka(fisik);
  const q = useQuery({
    queryKey: ["laporan-kas-kecil", periode, saldoFisik],
    queryFn: () => api<LaporanKasKecil>(`/laporan/kas-kecil${query({ periode, saldo_fisik: saldoFisik })}`),
    enabled: !!periode,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Laporan kas kecil</h1>
        {isPemilik(user?.role) && (
          <Link to="/laporan" className="text-xs font-semibold text-hijau">
            ← Laporan umum
          </Link>
        )}
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bulan">
            <Input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
          </Field>
          <Field label="Uang fisik (opsional)" hint="Isi untuk cek selisih">
            <Input inputMode="numeric" placeholder="0" value={fisik} onChange={(e) => setFisik(e.target.value)} />
          </Field>
        </div>
      </Card>

      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {q.data && (
        <>
          {q.data.status_selisih && (
            <p
              role="status"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${q.data.status_selisih === "sesuai" ? "bg-hijau-muda text-hijau" : "bg-red-50 text-red-700"}`}
            >
              {q.data.status_selisih === "sesuai"
                ? "Uang fisik sesuai catatan."
                : `Uang fisik ${q.data.status_selisih} ${rp(Math.abs(num(q.data.selisih)))} dari catatan.`}
            </p>
          )}
          <Card judul={`Ringkasan ${q.data.periode}`}>
            <Baris kiri="Saldo awal bulan" kanan={rp(q.data.saldo_awal)} />
            <Baris kiri="Total dipakai" kanan={rp(q.data.total_pemakaian)} />
            <Baris kiri="Total pengisian" kanan={rp(q.data.total_pengisian)} />
            <Baris kiri="Saldo akhir" kanan={rp(q.data.saldo_akhir)} tebal />
            <p className={`mt-1 text-xs ${q.data.sesuai_plafon ? "text-hijau" : "text-oranye"}`}>
              {q.data.sesuai_plafon ? `Sudah sesuai jatah ${rp(q.data.plafon)}` : `Belum kembali ke jatah ${rp(q.data.plafon)}`}
            </p>
          </Card>

          <Card judul="Per minggu">
            <div className="space-y-2">
              {q.data.per_minggu.map((w) => (
                <div key={w.minggu_ke} className="rounded-xl bg-stone-50 p-3">
                  <p className="text-sm font-semibold">
                    Minggu ke-{w.minggu_ke} <span className="font-normal text-stone-500">({tanggal(w.dari)} – {tanggal(w.sampai)})</span>
                  </p>
                  <Baris kiri="Dipakai" kanan={rp(w.pemakaian)} />
                  <Baris kiri="Diisi" kanan={rp(w.pengisian)} />
                  <Baris kiri="Saldo akhir minggu" kanan={rp(w.saldo_akhir)} />
                </div>
              ))}
            </div>
          </Card>

          <Card judul="Dipakai per kategori">
            {q.data.per_kategori.length === 0 && <p className="text-sm text-stone-500">Belum ada pengeluaran.</p>}
            {q.data.per_kategori.map((b) => (
              <Baris key={b.kategori} kiri={`${b.kategori} (${b.jumlah_transaksi}x)`} kanan={rp(b.jumlah)} />
            ))}
          </Card>

          <Card judul="Rincian pengeluaran">
            <ul className="divide-y divide-garis">
              {q.data.transaksi.map((t, i) => (
                <li key={i} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{t.kategori}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {tanggal(t.tanggal)}
                      {t.keterangan ? ` · ${t.keterangan}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{rp(t.jumlah)}</span>
                </li>
              ))}
              {q.data.transaksi.length === 0 && <li className="py-2 text-sm text-stone-500">Tidak ada.</li>}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
