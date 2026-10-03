import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { TableColumnsType } from "antd";
import { BarisTotal, Card, DataTabel, ErrorBox, Field, Input, Memuat, PageHeader } from "../components/ui";
import { api, query } from "../lib/api";
import { hariIni, num, rp, tanggal } from "../lib/format";
import type { BarisKategori, LaporanUmum } from "../lib/types";

const kolomKategori: TableColumnsType<BarisKategori> = [
  { title: "Kategori", dataIndex: "kategori" },
  { title: "Transaksi", dataIndex: "jumlah_transaksi", align: "right", width: 100, render: (v: number) => <span className="text-coklat">{v || "—"}</span> },
  { title: "Jumlah", dataIndex: "jumlah", align: "right", render: (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span> },
];

function TabelKategori({ judul, baris, total, labelTotal }: { judul: string; baris: BarisKategori[]; total?: string; labelTotal?: string }) {
  return (
    <Card judul={judul} className="min-w-0">
      <DataTabel
        kolom={kolomKategori}
        data={baris}
        rowKey="kategori"
        minLebar={320}
        kosong="Tidak ada."
        ringkasan={total !== undefined && baris.length > 0 ? () => <BarisTotal sel={[{ isi: labelTotal ?? "Total", span: 2 }, { isi: rp(total), kanan: true }]} /> : undefined}
      />
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
  const angka = (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span>;
  const kolomArus: TableColumnsType<LaporanUmum["arus_kas"][number]> = [
    { title: "Akun", dataIndex: "nama", fixed: "left", width: 150 },
    { title: "Saldo awal", dataIndex: "saldo_awal", align: "right", render: angka },
    { title: "Masuk", dataIndex: "masuk", align: "right", render: angka },
    { title: "Keluar", dataIndex: "keluar", align: "right", render: angka },
    { title: "Transfer masuk", dataIndex: "transfer_masuk", align: "right", render: angka },
    { title: "Transfer keluar", dataIndex: "transfer_keluar", align: "right", render: angka },
    { title: "Saldo akhir", dataIndex: "saldo_akhir", align: "right", render: (v: string) => <b className="tabular-nums whitespace-nowrap">{rp(v)}</b> },
  ];

  return (
    <>
      <PageHeader
        judul="Laporan umum"
        aksi={
          <Link to="/laporan/kas-kecil" className="text-sm font-semibold text-hijau">
            Laporan kas kecil →
          </Link>
        }
      />
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
            <DataTabel
              kolom={kolomArus}
              data={d.arus_kas}
              rowKey="akun_id"
              minLebar={820}
              ringkasan={() => <BarisTotal sel={[{ isi: "Total kas" }, { isi: rp(d.total_kas_awal), kanan: true }, { isi: "", span: 4 }, { isi: rp(d.total_kas_akhir), kanan: true }]} />}
            />
          </Card>
        </>
      )}
    </>
  );
}
