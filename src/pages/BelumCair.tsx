import { useQuery } from "@tanstack/react-query";
import { Col, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Angka, Baris, Card, DataTabel, ErrorBox, Field, InputTanggal, Memuat, PageHeader } from "../components/ui";
import { api, query } from "../lib/api";
import { hariIni, rp, tanggal } from "../lib/format";
import type { BelumCair, OrderBelumCair } from "../lib/types";

const kolom: TableColumnsType<OrderBelumCair> = [
  { title: "Kode pesanan", dataIndex: "no_order", render: (v: string) => v || "—" },
  { title: "Dikirim", dataIndex: "tgl_dikirim", render: (v: string) => <Angka>{tanggal(v)}</Angka> },
  { title: "Penjualan", dataIndex: "penjualan", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
  { title: "Potongan", dataIndex: "potongan", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
  { title: "Perkiraan cair", dataIndex: "perkiraan_cair", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

/** Order marketplace/Toko web yang sudah dikirim tetapi belum cair, per saluran (AB-BC-1). Bukan laba; berisiko retur. */
export default function BelumCairPage() {
  const [per, setPer] = useState(hariIni());
  const q = useQuery({ queryKey: ["belum-cair", per], queryFn: () => api<BelumCair>(`/laporan/belum-cair${query({ per_tanggal: per })}`) });
  const d = q.data;
  return (
    <>
      <PageHeader judul="Belum cair" sub="Order marketplace & Toko web yang sudah dikirim tetapi uangnya belum cair. Tidak dihitung sebagai laba; masih bisa retur." />
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
      {q.isLoading && <Memuat />}
      {d && (
        <>
          <Card judul="Ringkasan">
            <Baris kiri="Jumlah order" kanan={d.jumlah_order} />
            <Baris kiri="Penjualan (harga jual)" kanan={rp(d.total_penjualan)} />
            <Baris kiri="Perkiraan uang cair" kanan={rp(d.total_perkiraan_cair)} tebal />
            <Baris kiri="Dikirim paling lama" kanan={d.tgl_kirim_tertua ? tanggal(d.tgl_kirim_tertua) : "—"} />
          </Card>
          {d.per_saluran.length === 0 && <Typography.Paragraph type="secondary">Tidak ada order yang menunggu pencairan.</Typography.Paragraph>}
          {d.per_saluran.map((g) => (
            <Card key={g.saluran_id} judul={`${g.nama}: ${g.jumlah_order} order, perkiraan cair ${rp(g.total_perkiraan_cair)}`}>
              <div data-saluran={g.nama}>
                <Typography.Paragraph type="secondary">Dikirim paling lama {g.tgl_kirim_tertua ? tanggal(g.tgl_kirim_tertua) : "—"}</Typography.Paragraph>
                <DataTabel kolom={kolom} data={g.order} rowKey="order_id" minLebar={720} />
              </div>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
