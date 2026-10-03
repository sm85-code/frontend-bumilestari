import { Alert } from "antd";
import { Baris } from "./ui";
import { rp } from "../lib/format";
import type { BarisNilai } from "../lib/types";

/** Baris laporan bertingkat: label + jumlah, rincian ditampilkan menjorok. */
export function DaftarBaris({ data, kosong = "—" }: { data: BarisNilai[]; kosong?: string }) {
  if (data.length === 0) return <Baris kiri={kosong} kanan={rp(0)} />;
  return (
    <>
      {data.map((b) => (
        <div key={b.label}>
          <Baris kiri={b.label} kanan={rp(b.jumlah)} />
          {b.rincian.map((r) => (
            <div key={r.label} style={{ paddingLeft: 16, opacity: 0.75 }}>
              <Baris kiri={r.label} kanan={rp(r.jumlah)} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function LabelSementara({ sementara }: { sementara: boolean }) {
  return sementara ? <Alert type="warning" showIcon style={{ marginBottom: 16 }} title="Sementara — bulan belum ditutup" /> : null;
}

export const persen = (v: string | null) => (v == null ? "—" : `${Number(v).toLocaleString("id-ID")}%`);
