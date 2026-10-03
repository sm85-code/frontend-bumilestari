import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Baris, Button, Card, ErrorBox, Field, Input, Kosong, Lencana, Memuat, Tabel, Td, Th } from "../components/ui";
import { api, query } from "../lib/api";
import { useAksi } from "../lib/data";
import { bulanIni, hariIni, num, rp, tanggal } from "../lib/format";
import type { BagiHasil, BagiHasilHitung } from "../lib/types";

export default function BagiHasilPage() {
  const [periode, setPeriode] = useState(bulanIni());
  const hitungQ = useQuery({ queryKey: ["bagi-hasil-hitung", periode], queryFn: () => api<BagiHasilHitung>(`/bagi-hasil/hitung${query({ periode })}`) });
  const daftarQ = useQuery({ queryKey: ["bagi-hasil"], queryFn: () => api<BagiHasil[]>("/bagi-hasil") });
  const aksi = useAksi();
  const h = hitungQ.data;
  const adaAktif = (daftarQ.data ?? []).some((b) => b.periode === periode && !b.dibatalkan);

  return (
    <>
      <h1 className="text-lg font-bold">Bagi hasil bulanan</h1>
      <Card>
        <div className="max-w-xs">
          <Field label="Periode">
            <Input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
          </Field>
        </div>
      </Card>
      <ErrorBox error={hitungQ.error ?? daftarQ.error ?? aksi.error} />
      {hitungQ.isLoading && <Memuat />}
      {h && (
        <Card judul={`Pratinjau ${h.periode}`}>
          <Baris kiri="Pemasukan" kanan={rp(h.pemasukan)} />
          <Baris kiri="Biaya" kanan={rp(h.pengeluaran)} />
          <Baris kiri="Laba bersih" kanan={<span className={num(h.laba_bersih) < 0 ? "text-red-600" : "text-hijau"}>{rp(h.laba_bersih)}</span>} tebal />
          <div className="mt-2 border-t border-garis pt-2">
            <Baris kiri={`Admin (${num(h.persen_admin)}%)`} kanan={rp(h.bagian_admin)} />
            <Baris kiri={`Owner (${num(h.persen_owner)}%)`} kanan={rp(h.bagian_owner)} />
          </div>
          {num(h.laba_bersih) <= 0 && <p className="mt-2 text-xs text-stone-500">Laba nol atau rugi: tidak ada bagi hasil (kerugian tidak dibawa ke bulan berikutnya).</p>}
          <div className="mt-3">
            <Button disabled={aksi.isPending || adaAktif} onClick={() => aksi.mutate({ path: "/bagi-hasil", body: { periode } })}>
              {adaAktif ? "Sudah disimpan" : "Simpan perhitungan"}
            </Button>
          </div>
        </Card>
      )}
      <Card judul="Riwayat bagi hasil">
        {!daftarQ.data?.length ? (
          <Kosong teks="Belum ada bagi hasil tersimpan." />
        ) : (
          <Tabel minLebar={720}>
            <thead>
              <tr>
                <Th lengket>Periode</Th>
                <Th kanan>Laba bersih</Th>
                <Th kanan>Admin</Th>
                <Th kanan>Owner</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {daftarQ.data.map((b) => (
                <tr key={b.id}>
                  <Td lengket>{b.periode}</Td>
                  <Td kanan>{rp(b.laba_bersih)}</Td>
                  <Td kanan>{rp(b.bagian_admin)} <span className="text-xs text-stone-500">({num(b.persen_admin)}%)</span></Td>
                  <Td kanan>{rp(b.bagian_owner)} <span className="text-xs text-stone-500">({num(b.persen_owner)}%)</span></Td>
                  <Td>{b.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : b.tanggal_bayar ? <Lencana warna="hijau">dibayar {tanggal(b.tanggal_bayar)}</Lencana> : <Lencana warna="oranye">draft</Lencana>}</Td>
                  <Td className="whitespace-nowrap">
                    {!b.dibatalkan && !b.tanggal_bayar && num(b.bagian_admin) + num(b.bagian_owner) > 0 && (
                      <button
                        className="mr-3 text-xs font-semibold text-hijau hover:underline"
                        onClick={() => window.confirm(`Bayar bagi hasil ${b.periode} (${rp(num(b.bagian_admin) + num(b.bagian_owner))}) tunai dari kas utama?`) && aksi.mutate({ path: `/bagi-hasil/${b.id}/bayar?tanggal=${hariIni()}` })}
                      >
                        Bayar
                      </button>
                    )}
                    {!b.dibatalkan && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          const alasan = window.prompt("Alasan membatalkan/menghitung ulang?");
                          if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/bagi-hasil/${b.id}/batal`, body: { alasan: alasan.trim() } });
                        }}
                      >
                        Batalkan
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        )}
      </Card>
    </>
  );
}
