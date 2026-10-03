import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { TableColumnsType } from "antd";
import { Baris, Button, Card, DataTabel, ErrorBox, Field, Input, Lencana, Memuat, PageHeader, TombolLink } from "../components/ui";
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

  const persen = (n: string) => <span className="text-xs text-coklat">({num(n)}%)</span>;
  const kolom: TableColumnsType<BagiHasil> = [
    { title: "Periode", dataIndex: "periode", fixed: "left", width: 100 },
    { title: "Laba bersih", dataIndex: "laba_bersih", align: "right", render: (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span> },
    { title: "Admin", align: "right", render: (_, b) => <span className="tabular-nums whitespace-nowrap">{rp(b.bagian_admin)} {persen(b.persen_admin)}</span> },
    { title: "Owner", align: "right", render: (_, b) => <span className="tabular-nums whitespace-nowrap">{rp(b.bagian_owner)} {persen(b.persen_owner)}</span> },
    {
      title: "Status",
      render: (_, b) => (b.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : b.tanggal_bayar ? <Lencana warna="hijau">dibayar {tanggal(b.tanggal_bayar)}</Lencana> : <Lencana warna="oranye">draft</Lencana>),
    },
    {
      title: "Aksi",
      width: 150,
      render: (_, b) => (
        <span className="whitespace-nowrap">
          {!b.dibatalkan && !b.tanggal_bayar && num(b.bagian_admin) + num(b.bagian_owner) > 0 && (
            <TombolLink
              onClick={() => window.confirm(`Bayar bagi hasil ${b.periode} (${rp(num(b.bagian_admin) + num(b.bagian_owner))}) tunai dari kas utama?`) && aksi.mutate({ path: `/bagi-hasil/${b.id}/bayar?tanggal=${hariIni()}` })}
            >
              Bayar
            </TombolLink>
          )}
          {!b.dibatalkan && (
            <TombolLink
              bahaya
              onClick={() => {
                const alasan = window.prompt("Alasan membatalkan/menghitung ulang?");
                if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/bagi-hasil/${b.id}/batal`, body: { alasan: alasan.trim() } });
              }}
            >
              Batalkan
            </TombolLink>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader judul="Bagi hasil bulanan" sub="Admin dan owner, dihitung dari laba bersih tiap bulan" />
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
        <DataTabel kolom={kolom} data={daftarQ.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada bagi hasil tersimpan." />
      </Card>
    </>
  );
}
