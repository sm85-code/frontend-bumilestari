import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Baris, Card, ErrorBox, Field, Input, Kosong, Memuat, Tabel, Td, TdTotal, Th } from "../components/ui";
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
  const d = q.data;

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
        <div className="grid max-w-md grid-cols-2 gap-3">
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
      {d && (
        <>
          {d.status_selisih && (
            <p
              role="status"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${d.status_selisih === "sesuai" ? "bg-hijau-muda text-hijau" : "bg-red-50 text-red-700"}`}
            >
              {d.status_selisih === "sesuai"
                ? "Uang fisik sesuai catatan."
                : `Uang fisik ${d.status_selisih} ${rp(Math.abs(num(d.selisih)))} dari catatan.`}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Card judul={`Ringkasan ${d.periode}`}>
              <Baris kiri="Saldo awal bulan" kanan={rp(d.saldo_awal)} />
              <Baris kiri="Total dipakai" kanan={rp(d.total_pemakaian)} />
              <Baris kiri="Total pengisian" kanan={rp(d.total_pengisian)} />
              <Baris kiri="Saldo akhir" kanan={rp(d.saldo_akhir)} tebal />
              <p className={`mt-1 text-xs ${d.sesuai_plafon ? "text-hijau" : "text-oranye"}`}>
                {d.sesuai_plafon ? `Sudah sesuai jatah ${rp(d.plafon)}` : `Belum kembali ke jatah ${rp(d.plafon)}`}
              </p>
            </Card>

            <Card judul="Dipakai per kategori" className="min-w-0">
              {d.per_kategori.length === 0 ? (
                <Kosong teks="Belum ada pengeluaran." />
              ) : (
                <Tabel minLebar={300}>
                  <thead>
                    <tr>
                      <Th lengket>Kategori</Th>
                      <Th kanan>Transaksi</Th>
                      <Th kanan>Jumlah</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.per_kategori.map((b) => (
                      <tr key={b.kategori}>
                        <Td lengket>{b.kategori}</Td>
                        <Td kanan className="text-stone-500">{b.jumlah_transaksi}</Td>
                        <Td kanan>{rp(b.jumlah)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabel>
              )}
            </Card>

          </div>

          <Card judul="Per minggu" className="min-w-0">
            <Tabel minLebar={520}>
              <thead>
                <tr>
                  <Th lengket>Minggu</Th>
                  <Th>Periode</Th>
                  <Th kanan>Dipakai</Th>
                  <Th kanan>Diisi</Th>
                  <Th kanan>Saldo akhir</Th>
                </tr>
              </thead>
              <tbody>
                {d.per_minggu.map((w) => (
                  <tr key={w.minggu_ke}>
                    <Td lengket>Ke-{w.minggu_ke}</Td>
                    <Td className="whitespace-nowrap text-stone-600">
                      {tanggal(w.dari)} – {tanggal(w.sampai)}
                    </Td>
                    <Td kanan>{rp(w.pemakaian)}</Td>
                    <Td kanan>{rp(w.pengisian)}</Td>
                    <Td kanan>{rp(w.saldo_akhir)}</Td>
                  </tr>
                ))}
                <tr>
                  <TdTotal lengket colSpan={2}>Total</TdTotal>
                  <TdTotal kanan>{rp(d.total_pemakaian)}</TdTotal>
                  <TdTotal kanan>{rp(d.total_pengisian)}</TdTotal>
                  <TdTotal kanan>{rp(d.saldo_akhir)}</TdTotal>
                </tr>
              </tbody>
            </Tabel>
          </Card>

          <Card judul="Rincian pengeluaran" className="min-w-0">
            {d.transaksi.length === 0 ? (
              <Kosong teks="Tidak ada." />
            ) : (
              <Tabel minLebar={460}>
                <thead>
                  <tr>
                    <Th lengket>Tanggal</Th>
                    <Th>Kategori</Th>
                    <Th>Keterangan</Th>
                    <Th kanan>Jumlah</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.transaksi.map((t, i) => (
                    <tr key={i}>
                      <Td lengket className="whitespace-nowrap">{tanggal(t.tanggal)}</Td>
                      <Td>{t.kategori}</Td>
                      <Td className="text-stone-600">{t.keterangan || "—"}</Td>
                      <Td kanan>{rp(t.jumlah)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabel>
            )}
          </Card>
        </>
      )}
    </>
  );
}
