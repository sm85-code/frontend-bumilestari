import { useQuery } from "@tanstack/react-query";
import { Alert, Col, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DaftarBaris, LabelSementara, persen } from "../components/LaporanBaris";
import { Angka, Baris, Card, DataTabel, ErrorBox, Field, InputTanggal, Memuat, PageHeader, Tabs } from "../components/ui";
import { api, query } from "../lib/api";
import { bulanTahun, hariIni, rp, tanggal } from "../lib/format";
import { periodeSebelum } from "../lib/tugas";
import type { HppMargin, LabaRugi, MarginBaris, Neraca } from "../lib/types";
import LaporanUmumPage from "./LaporanUmum";

type Tab = "laba" | "neraca" | "margin" | "arus";

function PilihBulan({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Field label="Bulan">
            <InputTanggal bulan value={value} onChange={onChange} />
          </Field>
        </Col>
      </Row>
    </Card>
  );
}

function TabLabaRugi({ periode }: { periode: string }) {
  const q = useQuery({ queryKey: ["laba-rugi", periode], queryFn: () => api<LabaRugi>(`/laporan/laba-rugi${query({ periode })}`) });
  const d = q.data;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!d) return <Memuat />;
  return (
    <div data-laba-rugi>
      <LabelSementara sementara={d.sementara} />
      <Card judul={`Laba rugi ${bulanTahun(d.periode)}`}>
        <Typography.Text strong>Penjualan cair (bruto)</Typography.Text>
        <DaftarBaris data={d.penjualan} />
        <Baris kiri="Total penjualan" kanan={rp(d.total_penjualan)} tebal />
        <Typography.Text strong>(−) Biaya marketplace</Typography.Text>
        <DaftarBaris data={d.biaya_marketplace} />
        <Baris kiri="Penjualan bersih" kanan={rp(d.penjualan_bersih)} tebal />
        <Baris kiri="(−) HPP (biaya tukang & supplier)" kanan={rp(d.hpp)} />
        <Baris kiri={`Laba kotor · margin ${persen(d.margin_persen)}`} kanan={rp(d.laba_kotor)} tebal />
        <Typography.Text strong>(−) Biaya operasional</Typography.Text>
        <DaftarBaris data={d.biaya_operasional} />
        {d.pendapatan_lain.length > 0 && (
          <>
            <Typography.Text strong>(+) Pendapatan lain</Typography.Text>
            <DaftarBaris data={d.pendapatan_lain} />
          </>
        )}
        <div data-laba-bersih>
          <Baris kiri="Laba bersih (dasar bagi hasil)" kanan={rp(d.laba_bersih)} tebal />
        </div>
        {d.di_luar_laba.length > 0 && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            Tidak termasuk laba: {d.di_luar_laba.map((b) => `${b.label} ${rp(b.jumlah)}`).join(", ")}.
          </Typography.Paragraph>
        )}
      </Card>
      <Card judul="Catatan">
        <div data-belum-cair>
          <Baris kiri={`Penjualan belum cair (${d.belum_cair.jumlah_order} order) — berisiko retur, belum dihitung`} kanan={rp(d.belum_cair.total_penjualan)} />
          <Baris kiri="Dikirim paling lama" kanan={d.belum_cair.tgl_kirim_tertua ? tanggal(d.belum_cair.tgl_kirim_tertua) : "—"} />
          <Baris kiri="Perkiraan laba jika semua cair (info saja)" kanan={rp(d.belum_cair.perkiraan_laba_jika_cair)} />
        </div>
        <Baris kiri="HPP dicocokkan per order yang cair/dibayar (info)" kanan={rp(d.hpp_dicocokkan)} />
        <Link to="/laporan/belum-cair">Lihat order belum cair →</Link>
      </Card>
    </div>
  );
}

function TabNeraca() {
  const [per, setPer] = useState(hariIni());
  const q = useQuery({ queryKey: ["neraca", per], queryFn: () => api<Neraca>(`/laporan/neraca${query({ per_tanggal: per })}`) });
  const d = q.data;
  return (
    <>
      <Card>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Field label="Per tanggal">
              <InputTanggal value={per} onChange={setPer} />
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={q.error} />
      {!d && !q.error && <Memuat />}
      {d && (
        <div data-neraca>
          {Number(d.selisih) !== 0 && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              title={`Neraca tidak seimbang: selisih ${rp(d.selisih)}`}
              description="Periksa saldo awal akun atau transaksi yang salah catat."
            />
          )}
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card judul="Aset">
                <DaftarBaris data={d.aset_kas} />
                <Baris kiri="Tagihan penjual lain (belum dibayar)" kanan={rp(d.piutang_penjual_lain)} />
                <Typography.Text strong>Belum cair (perkiraan cair)</Typography.Text>
                <DaftarBaris data={d.belum_cair} kosong="Tidak ada" />
                <Baris kiri="Total aset" kanan={rp(d.total_aset)} tebal />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card judul="Kewajiban">
                <Typography.Text strong>Utang ke tukang & supplier</Typography.Text>
                <DaftarBaris data={d.utang_pemasok} kosong="Tidak ada" />
                <Baris kiri="Dana gaji disisihkan, belum dibayar" kanan={rp(d.dana_gaji_belum_dibayar)} />
                <Typography.Text strong>Talangan</Typography.Text>
                <DaftarBaris data={d.talangan} kosong="Tidak ada" />
                <Baris kiri="Total kewajiban" kanan={rp(d.total_kewajiban)} tebal />
              </Card>
              <Card judul="Modal">
                <DaftarBaris data={d.modal} />
                <Baris kiri="Total modal" kanan={rp(d.total_modal)} tebal />
              </Card>
            </Col>
          </Row>
          <Card>
            <div data-selisih>
              <Baris kiri="Pemeriksaan: aset − (kewajiban + modal)" kanan={rp(d.selisih)} tebal />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

const angka = (v: string) => <Angka>{rp(v)}</Angka>;
const kolomMargin = (judul: string): TableColumnsType<MarginBaris> => [
  { title: judul, dataIndex: "label", fixed: "left", width: 180 },
  { title: "Qty", dataIndex: "qty", align: "right" },
  { title: "Penjualan", dataIndex: "penjualan", align: "right", render: angka },
  { title: "Potongan", dataIndex: "potongan", align: "right", render: angka },
  { title: "HPP", dataIndex: "hpp", align: "right", render: angka },
  { title: "Laba kotor", dataIndex: "laba_kotor", align: "right", render: angka },
  { title: "Margin", dataIndex: "margin_persen", align: "right", render: (v: string | null) => persen(v) },
];

function TabMargin({ periode }: { periode: string }) {
  const q = useQuery({ queryKey: ["hpp-margin", periode], queryFn: () => api<HppMargin>(`/laporan/hpp-margin${query({ periode })}`) });
  const d = q.data;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!d) return <Memuat />;
  return (
    <div data-margin>
      <LabelSementara sementara={d.sementara} />
      <Typography.Paragraph type="secondary">Dihitung dari order yang penjualannya diakui di bulan ini: marketplace & Toko web saat cair, penjual lain saat dibayar.</Typography.Paragraph>
      <Card judul={`Total: ${d.total.jumlah_order} order, laba kotor ${rp(d.total.laba_kotor)} · margin ${persen(d.total.margin_persen)}`}>
        <Typography.Text strong>Per saluran</Typography.Text>
        <DataTabel kolom={kolomMargin("Saluran")} data={d.per_saluran} rowKey="label" minLebar={720} />
        <Typography.Text strong>Per produk</Typography.Text>
        <DataTabel kolom={kolomMargin("Produk")} data={d.per_produk} rowKey="label" minLebar={720} />
      </Card>
    </div>
  );
}

/** Laporan keuangan (spesifikasi 9.1-9.3): laba rugi per saluran, neraca sederhana, HPP & margin, arus kas per kategori. */
export default function LaporanKeuanganPage() {
  const [tab, setTab] = useState<Tab>("laba");
  const [periode, setPeriode] = useState(() => periodeSebelum(hariIni()));
  return (
    <>
      <PageHeader judul="Laporan keuangan" sub="Laba rugi, neraca, HPP & margin" aksi={<Link to="/laporan/kas-kecil">Laporan kas kecil →</Link>} />
      <Tabs
        daftar={[
          { id: "laba", label: "Laba rugi" },
          { id: "neraca", label: "Neraca" },
          { id: "margin", label: "HPP & margin" },
          { id: "arus", label: "Arus kas & kategori" },
        ]}
        aktif={tab}
        onPilih={setTab}
      />
      {(tab === "laba" || tab === "margin") && <PilihBulan value={periode} onChange={setPeriode} />}
      {tab === "laba" && <TabLabaRugi periode={periode} />}
      {tab === "neraca" && <TabNeraca />}
      {tab === "margin" && <TabMargin periode={periode} />}
      {tab === "arus" && <LaporanUmumPage tertanam />}
    </>
  );
}
