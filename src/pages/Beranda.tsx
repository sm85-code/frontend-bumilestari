import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Baris, Card, ErrorBox, Memuat, Progress, Stat, Tabel, Td, TdTotal, Th } from "../components/ui";
import { api } from "../lib/api";
import { num, rp, tanggal } from "../lib/format";
import type { Dashboard, Imprest } from "../lib/types";

const STATUS_LABEL: Record<string, string> = {
  dipesan: "Dipesan",
  dikerjakan: "Dikerjakan",
  diambil: "Diambil",
  diterima: "Diterima",
  dicat: "Dicat",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

function KartuImprest({ judul, data, ke }: { judul: string; data: Imprest; ke?: string }) {
  const perlu = num(data.perlu_diisi);
  return (
    <Card judul={judul} aksi={ke ? <Link to={ke} className="text-xs font-semibold text-hijau">Lihat</Link> : undefined}>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{rp(data.saldo)}</span>
        <span className="text-xs text-stone-500">jatah {rp(data.plafon)}</span>
      </div>
      <div className="my-2">
        <Progress nilai={num(data.saldo)} maks={num(data.plafon)} />
      </div>
      <p className={`text-xs ${perlu > 0 ? "font-semibold text-oranye" : "text-stone-500"}`}>
        {perlu > 0 ? `Perlu diisi ${rp(perlu)} hari Selasa` : "Sudah penuh"}
      </p>
    </Card>
  );
}

export default function Beranda() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });

  if (isLoading) return <Memuat />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Data tidak tersedia")} />;

  const laba = num(data.laba_bulan_ini);
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-bold">Beranda</h1>
        <span className="text-xs text-coklat">Selasa acuan {tanggal(data.selasa)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total kas" nilai={rp(data.total_kas)} />
        <Stat label={`Laba ${data.periode}`} nilai={rp(data.laba_bulan_ini)} warna={laba < 0 ? "merah" : "hijau"} sub={`Masuk ${rp(data.pemasukan_bulan_ini)}`} />
        <Stat label="Bayar tukang Selasa ini" nilai={rp(data.utang_pemasok_siap_bayar)} warna="oranye" />
        <Stat label="Tagihan penjual lain" nilai={rp(data.piutang_penjual_lain)} sub="belum dibayar" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:items-start">
      <Card judul="Order">
        <p className="mb-2 text-sm">
          <b>{data.order_bulan_ini}</b> order bulan ini · omzet <b>{rp(data.omzet_order_bulan_ini)}</b>
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.order_per_status).map(([s, n]) => (
            <span key={s} className="rounded-full bg-hijau-muda px-3 py-1 text-xs text-hijau">
              {STATUS_LABEL[s] ?? s}: <b>{n}</b>
            </span>
          ))}
          {Object.keys(data.order_per_status).length === 0 && <span className="text-xs text-stone-500">Belum ada order</span>}
        </div>
      </Card>

      {data.kas_kecil && <KartuImprest judul="Kas kecil" data={data.kas_kecil} ke="/kas-kecil" />}
      {data.kas_iklan && <KartuImprest judul="Kas iklan (admin)" data={data.kas_iklan} />}

      <Card judul="Saldo akun">
        <Tabel minLebar={300}>
          <thead>
            <tr>
              <Th lengket>Akun</Th>
              <Th kanan>Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {data.akun.map((a) => (
              <tr key={a.id}>
                <Td lengket>{a.nama}</Td>
                <Td kanan>{rp(a.saldo)}</Td>
              </tr>
            ))}
            <tr>
              <Td lengket className="text-stone-600">Dana cadangan (gaji)</Td>
              <Td kanan>{rp(data.dana_cadangan)}</Td>
            </tr>
            <tr>
              <TdTotal lengket>Total kas</TdTotal>
              <TdTotal kanan>{rp(data.total_kas)}</TdTotal>
            </tr>
          </tbody>
        </Tabel>
      </Card>
      </div>

      {data.bagian_admin_pratinjau !== null && data.bagian_owner_pratinjau !== null && (
        <Card judul={`Pratinjau bagi hasil ${data.periode}`}>
          <Baris kiri="Admin" kanan={rp(data.bagian_admin_pratinjau)} />
          <Baris kiri="Owner" kanan={rp(data.bagian_owner_pratinjau)} />
          <p className="mt-1 text-xs text-stone-500">Dihitung dari laba bulan berjalan; angka final saat bagi hasil disimpan.</p>
        </Card>
      )}
    </>
  );
}
