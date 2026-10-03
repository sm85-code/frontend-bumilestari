import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, ErrorBox, Field, Input, Kosong, Memuat, Tabel, Td, TdTotal, Th } from "../components/ui";
import { api, query } from "../lib/api";
import { hariIni, num, rp, tanggal } from "../lib/format";
import type { BarisKategori, LaporanUmum } from "../lib/types";

function TabelKategori({ judul, baris, total, labelTotal }: { judul: string; baris: BarisKategori[]; total?: string; labelTotal?: string }) {
  return (
    <Card judul={judul} className="min-w-0">
      {baris.length === 0 ? (
        <Kosong teks="Tidak ada." />
      ) : (
        <Tabel minLebar={320}>
          <thead>
            <tr>
              <Th lengket>Kategori</Th>
              <Th kanan>Transaksi</Th>
              <Th kanan>Jumlah</Th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.kategori}>
                <Td lengket>{b.kategori}</Td>
                <Td kanan className="text-stone-500">{b.jumlah_transaksi || "—"}</Td>
                <Td kanan>{rp(b.jumlah)}</Td>
              </tr>
            ))}
            {total !== undefined && (
              <tr>
                <TdTotal lengket colSpan={2}>{labelTotal ?? "Total"}</TdTotal>
                <TdTotal kanan>{rp(total)}</TdTotal>
              </tr>
            )}
          </tbody>
        </Tabel>
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
  const d = q.data;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Laporan umum</h1>
        <Link to="/laporan/kas-kecil" className="text-xs font-semibold text-hijau">
          Laporan kas kecil →
        </Link>
      </div>
      <Card>
        <div className="grid max-w-md grid-cols-2 gap-3">
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
      {d && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <TabelKategori judul="Pemasukan" baris={d.pemasukan} total={d.total_pemasukan} labelTotal="Total pemasukan" />
            <TabelKategori judul="Biaya" baris={d.biaya} total={d.total_biaya} labelTotal="Total biaya" />
          </div>
          <Card>
            <div className="flex items-baseline justify-between text-base font-bold">
              <span>Laba bersih</span>
              <span className={num(d.laba_bersih) < 0 ? "text-red-600" : "text-hijau"}>{rp(d.laba_bersih)}</span>
            </div>
          </Card>
          {d.di_luar_laba.length > 0 && <TabelKategori judul="Di luar laba (prive, bagi hasil)" baris={d.di_luar_laba} />}

          <Card judul={`Arus kas ${tanggal(d.dari)} – ${tanggal(d.sampai)}`}>
            <Tabel minLebar={760}>
              <thead>
                <tr>
                  <Th lengket>Akun</Th>
                  <Th kanan>Saldo awal</Th>
                  <Th kanan>Masuk</Th>
                  <Th kanan>Keluar</Th>
                  <Th kanan>Transfer masuk</Th>
                  <Th kanan>Transfer keluar</Th>
                  <Th kanan>Saldo akhir</Th>
                </tr>
              </thead>
              <tbody>
                {d.arus_kas.map((a) => (
                  <tr key={a.akun_id}>
                    <Td lengket>{a.nama}</Td>
                    <Td kanan>{rp(a.saldo_awal)}</Td>
                    <Td kanan>{rp(a.masuk)}</Td>
                    <Td kanan>{rp(a.keluar)}</Td>
                    <Td kanan>{rp(a.transfer_masuk)}</Td>
                    <Td kanan>{rp(a.transfer_keluar)}</Td>
                    <Td kanan tebal>{rp(a.saldo_akhir)}</Td>
                  </tr>
                ))}
                <tr>
                  <TdTotal lengket>Total kas</TdTotal>
                  <TdTotal kanan>{rp(d.total_kas_awal)}</TdTotal>
                  <TdTotal colSpan={4} />
                  <TdTotal kanan>{rp(d.total_kas_akhir)}</TdTotal>
                </tr>
              </tbody>
            </Tabel>
          </Card>
        </>
      )}
    </>
  );
}
