import { useQuery } from "@tanstack/react-query";
import { Col, Row, Typography } from "antd";
import { LabelSementara } from "../components/LaporanBaris";
import { Baris, Card, ErrorBox, Lencana, Memuat, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import { bulanTahun, num, rp, tanggal } from "../lib/format";
import type { RingkasanOwner } from "../lib/types";

/** Ringkasan Owner (spesifikasi 9.7): satu halaman, bahasa sederhana, hanya baca. */
export default function RingkasanOwnerPage() {
  const q = useQuery({ queryKey: ["ringkasan-owner"], queryFn: () => api<RingkasanOwner>("/laporan/ringkasan-owner") });
  const d = q.data;
  const maks = Math.max(1, ...(d?.tren ?? []).map((t) => Math.abs(num(t.laba_bersih))));
  return (
    <>
      <PageHeader judul="Ringkasan" sub="Gambaran usaha dalam satu halaman" />
      <ErrorBox error={q.error} />
      {!d && !q.error && <Memuat />}
      {d && (
        <div data-ringkasan>
          <LabelSementara sementara={d.sementara} />
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card judul={`Untung rugi ${bulanTahun(d.periode)}`}>
                <Baris kiri="Penjualan" kanan={rp(d.penjualan)} />
                <Baris kiri="Biaya barang (tukang & supplier)" kanan={rp(d.hpp)} />
                <Baris kiri="Biaya iklan" kanan={rp(d.biaya_iklan)} />
                <Baris kiri="Biaya lainnya" kanan={rp(d.biaya_operasional_lain)} />
                <Baris kiri="Laba bersih" kanan={rp(d.laba_bersih)} tebal />
              </Card>
              <Card judul="Laba bersih beberapa bulan">
                {d.tren.map((t) => (
                  <div key={t.periode} data-tren={t.periode} style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span>{bulanTahun(t.periode)}</span>
                    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 12 }}>
                      <div
                        style={{
                          width: `${(Math.abs(num(t.laba_bersih)) / maks) * 100}%`,
                          height: 12,
                          borderRadius: 4,
                          background: num(t.laba_bersih) < 0 ? "#ff4d4f" : "#52c41a",
                          opacity: t.sementara ? 0.5 : 1,
                        }}
                      />
                    </div>
                    <span style={{ textAlign: "right" }}>{rp(t.laba_bersih)}</span>
                  </div>
                ))}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card judul="Posisi keuangan hari ini">
                <Baris kiri="Uang di semua kas" kanan={rp(d.total_kas)} />
                <Baris kiri="Uang yang masih akan masuk" kanan={rp(d.piutang)} />
                <Baris kiri="Yang masih harus dibayar" kanan={rp(d.utang)} />
                <Baris kiri="Modal" kanan={rp(d.modal)} tebal />
              </Card>
              <Card judul="Modal">
                <Baris kiri="Setoran modal" kanan={rp(d.setoran_modal)} />
                <Baris kiri="Laba yang ditahan" kanan={rp(d.laba_ditahan)} />
                <Baris kiri="Bagi hasil sudah dibayar" kanan={rp(d.bagi_hasil_dibayar)} />
              </Card>
              <Card judul="Bagi hasil Owner">
                {d.bagi_hasil.length === 0 && <Typography.Text type="secondary">Belum ada bagi hasil.</Typography.Text>}
                {d.bagi_hasil.map((b) => (
                  <div key={b.periode} data-bagi-hasil={b.periode}>
                    <Baris
                      kiri={
                        <>
                          {bulanTahun(b.periode)} ({Number(b.persen_owner)}%){" "}
                          {b.dibayar ? <Lencana warna="hijau">Dibayar {b.tanggal_bayar ? tanggal(b.tanggal_bayar) : ""}</Lencana> : <Lencana warna="oranye">Belum dibayar</Lencana>}
                        </>
                      }
                      kanan={rp(b.bagian_owner)}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </>
  );
}
