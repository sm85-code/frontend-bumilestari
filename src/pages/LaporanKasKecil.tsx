import { useQuery } from "@tanstack/react-query";
import { Alert, Col, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Angka, Baris, BarisTotal, Card, DataTabel, ErrorBox, Field, Input, InputTanggal, Memuat, PageHeader } from "../components/ui";
import { api, query } from "../lib/api";
import { bersihkanAngka, bulanIni, num, rp, tanggal } from "../lib/format";
import type { LaporanKasKecil } from "../lib/types";

const angka = (v: string) => <Angka>{rp(v)}</Angka>;
const kolomKategori: TableColumnsType<LaporanKasKecil["per_kategori"][number]> = [
  { title: "Kategori", dataIndex: "kategori" },
  { title: "Transaksi", dataIndex: "jumlah_transaksi", align: "right", width: 100, render: (v: number) => <Typography.Text type="secondary">{v}</Typography.Text> },
  { title: "Jumlah", dataIndex: "jumlah", align: "right", render: angka },
];
const kolomMinggu: TableColumnsType<LaporanKasKecil["per_minggu"][number]> = [
  { title: "Minggu", dataIndex: "minggu_ke", fixed: "left", width: 90, render: (v: number) => `Ke-${v}` },
  { title: "Periode", render: (_, w) => <Angka>{tanggal(w.dari)} – {tanggal(w.sampai)}</Angka> },
  { title: "Dipakai", dataIndex: "pemakaian", align: "right", render: angka },
  { title: "Diisi", dataIndex: "pengisian", align: "right", render: angka },
  { title: "Saldo akhir", dataIndex: "saldo_akhir", align: "right", render: angka },
];
const kolomRincian: TableColumnsType<LaporanKasKecil["transaksi"][number]> = [
  { title: "Tanggal", dataIndex: "tanggal", fixed: "left", width: 110, render: (v: string) => <Angka>{tanggal(v)}</Angka> },
  { title: "Kategori", dataIndex: "kategori" },
  { title: "Keterangan", dataIndex: "keterangan", render: (v: string) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
  { title: "Jumlah", dataIndex: "jumlah", align: "right", render: angka },
];

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
      <PageHeader judul="Laporan kas kecil" aksi={isPemilik(user?.role) && <Link to="/laporan">← Laporan umum</Link>} />
      <Card>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Field label="Bulan">
              <InputTanggal bulan value={periode} onChange={setPeriode} />
            </Field>
          </Col>
          <Col xs={24} md={8}>
            <Field label="Uang fisik (opsional)" hint="Isi untuk cek selisih">
              <Input inputMode="numeric" placeholder="0" value={fisik} onChange={(e) => setFisik(e.target.value)} />
            </Field>
          </Col>
        </Row>
      </Card>

      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {d && (
        <>
          {d.status_selisih && (
            <Alert
              type={d.status_selisih === "sesuai" ? "success" : "error"}
              showIcon
              title={d.status_selisih === "sesuai" ? "Uang fisik sesuai catatan." : `Uang fisik ${d.status_selisih} ${rp(Math.abs(num(d.selisih)))} dari catatan.`}
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card judul={`Ringkasan ${d.periode}`}>
                <Baris kiri="Saldo awal bulan" kanan={rp(d.saldo_awal)} />
                <Baris kiri="Total dipakai" kanan={rp(d.total_pemakaian)} />
                <Baris kiri="Total pengisian" kanan={rp(d.total_pengisian)} />
                <Baris kiri="Saldo akhir" kanan={rp(d.saldo_akhir)} tebal />
                <Typography.Text type={d.sesuai_plafon ? "success" : "warning"}>
                  {d.sesuai_plafon ? `Sudah sesuai jatah ${rp(d.plafon)}` : `Belum kembali ke jatah ${rp(d.plafon)}`}
                </Typography.Text>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card judul="Dipakai per kategori">
                <DataTabel kolom={kolomKategori} data={d.per_kategori} rowKey="kategori" minLebar={300} kosong="Belum ada pengeluaran." />
              </Card>
            </Col>
          </Row>

          <Card judul="Per minggu">
            <DataTabel
              kolom={kolomMinggu}
              data={d.per_minggu}
              rowKey="minggu_ke"
              minLebar={560}
              ringkasan={() => (
                <BarisTotal sel={[{ isi: "Total", span: 2 }, { isi: rp(d.total_pemakaian), kanan: true }, { isi: rp(d.total_pengisian), kanan: true }, { isi: rp(d.saldo_akhir), kanan: true }]} />
              )}
            />
          </Card>

          <Card judul="Rincian pengeluaran">
            <DataTabel kolom={kolomRincian} data={d.transaksi} rowKey={(t) => `${t.tanggal}-${t.kategori}-${t.jumlah}-${t.keterangan}`} minLebar={500} kosong="Tidak ada." />
          </Card>
        </>
      )}
    </>
  );
}
