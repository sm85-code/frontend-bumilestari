import { Checkbox, Col, Row } from "antd";
import { Field, Input, InputTanggal, Select } from "./ui";
import { kolomForm, useDefinisiKolom } from "../lib/kolom";
import type { EntitasKolom, NilaiKolom } from "../lib/types";

/** Isian kolom tambahan dari Data master (spesifikasi 10.4). Validasi akhir di backend (AB-DM-6). */
export default function IsianKolomTambahan({
  entitas,
  nilai,
  onUbah,
}: {
  entitas: EntitasKolom;
  nilai: Record<string, NilaiKolom>;
  onUbah: (v: Record<string, NilaiKolom>) => void;
}) {
  const defs = kolomForm(useDefinisiKolom(entitas).data);
  if (defs.length === 0) return null;
  const set = (k: string, v: NilaiKolom) => onUbah({ ...nilai, [k]: v });
  return (
    <Row gutter={16} data-kolom-tambahan={entitas}>
      {defs.map((d) => {
        const v = nilai[d.kunci];
        const label = d.wajib ? `${d.label} *` : d.label;
        let isi;
        if (d.tipe === "ya_tidak") {
          isi = (
            <Checkbox checked={v === true} onChange={(e) => set(d.kunci, e.target.checked)} aria-label={d.label}>
              Ya
            </Checkbox>
          );
        } else if (d.tipe === "pilihan") {
          const opsi = d.pilihan.filter((p) => !p.arsip || p.nilai === v);
          isi = (
            <Select aria-label={d.label} placeholder="Pilih" value={typeof v === "string" ? v : ""} onChange={(e) => set(d.kunci, e.target.value)}>
              <option value="">—</option>
              {opsi.map((p) => (
                <option key={p.nilai} value={p.nilai}>
                  {p.nilai}
                </option>
              ))}
            </Select>
          );
        } else if (d.tipe === "tanggal") {
          isi = <InputTanggal kosongBoleh value={typeof v === "string" ? v : ""} onChange={(x) => set(d.kunci, x)} />;
        } else {
          isi = (
            <Input
              aria-label={d.label}
              inputMode={d.tipe === "angka" || d.tipe === "mata_uang" ? "decimal" : undefined}
              maxLength={d.tipe === "teks" ? 500 : 40}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => set(d.kunci, e.target.value)}
            />
          );
        }
        return (
          <Col xs={24} md={12} key={d.kunci}>
            <Field label={label}>{isi}</Field>
          </Col>
        );
      })}
    </Row>
  );
}
