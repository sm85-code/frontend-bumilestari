import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Baris, Card, ErrorBox, Field, Input, Memuat } from "../components/ui";
import { api, query } from "../lib/api";
import { hariIni, num, rp, tanggal } from "../lib/format";
import type { BarisKategori, LaporanUmum } from "../lib/types";

function Bagian({ judul, baris, total, labelTotal }: { judul: string; baris: BarisKategori[]; total?: string; labelTotal?: string }) {
  return (
    <Card judul={judul}>
      {baris.length === 0 && <p className="text-sm text-stone-500">Tidak ada.</p>}
      {baris.map((b) => (
        <Baris key={b.kategori} kiri={b.kategori} kanan={rp(b.jumlah)} />
      ))}
      {total !== undefined && (
        <div className="mt-1 border-t border-garis pt-1">
          <Baris kiri={labelTotal ?? "Total"} kanan={rp(total)} tebal />
        </div>
      )}
    </Card>
  );
}

export default function LaporanUmumPage() {
  const awalBulan = `${hariIni().slice(0, 7)}-01`;
  const [dari, setDari] = useState(awalBulan);
  const [sampai, setSampai] = useState(hariIni());
  const q = useQuery({
    queryKey: ["laporan-umum", dari, sampai],
    queryFn: () => api<LaporanUmum>(`/laporan/umum${query({ dari, sampai })}`),
    enabled: !!dari && !!sampai,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Laporan umum</h1>
        <Link to="/laporan/kas-kecil" className="text-xs font-semibold text-hijau">
          Laporan kas kecil →
        </Link>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari">
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </Field>
        </div>
      </Card>

      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {q.data && (
        <>
          <Bagian judul="Pemasukan" baris={q.data.pemasukan} total={q.data.total_pemasukan} labelTotal="Total pemasukan" />
          <Bagian judul="Biaya" baris={q.data.biaya} total={q.data.total_biaya} labelTotal="Total biaya" />
          <Card>
            <Baris
              kiri="Laba bersih"
              kanan={<span className={num(q.data.laba_bersih) < 0 ? "text-red-600" : "text-hijau"}>{rp(q.data.laba_bersih)}</span>}
              tebal
            />
          </Card>
          {q.data.di_luar_laba.length > 0 && <Bagian judul="Di luar laba (prive, bagi hasil)" baris={q.data.di_luar_laba} />}

          <Card judul={`Arus kas ${tanggal(q.data.dari)} – ${tanggal(q.data.sampai)}`}>
            <div className="space-y-3">
              {q.data.arus_kas.map((a) => (
                <div key={a.akun_id} className="rounded-xl bg-stone-50 p-3">
                  <p className="text-sm font-semibold">{a.nama}</p>
                  <Baris kiri="Saldo awal" kanan={rp(a.saldo_awal)} />
                  <Baris kiri="Masuk" kanan={rp(a.masuk)} />
                  <Baris kiri="Keluar" kanan={rp(a.keluar)} />
                  <Baris kiri="Transfer masuk" kanan={rp(a.transfer_masuk)} />
                  <Baris kiri="Transfer keluar" kanan={rp(a.transfer_keluar)} />
                  <Baris kiri="Saldo akhir" kanan={rp(a.saldo_akhir)} tebal />
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-garis pt-1">
              <Baris kiri="Total kas awal" kanan={rp(q.data.total_kas_awal)} />
              <Baris kiri="Total kas akhir" kanan={rp(q.data.total_kas_akhir)} tebal />
            </div>
          </Card>
        </>
      )}
    </>
  );
}
