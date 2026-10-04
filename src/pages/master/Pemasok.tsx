import { Col, Row, Space, Typography } from "antd";
import IsianKolomTambahan from "../../components/IsianKolomTambahan";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Memuat, Select, TombolLink, useDialog } from "../../components/ui";
import { useAksi, usePemasok } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pemasok, NilaiKolom } from "../../lib/types";

export type JenisPemasok = Pemasok["jenis"];
const LABEL_JENIS: Record<string, string> = { tukang_kayu: "Tukang", supplier: "Supplier" };

function Form({ awal, jenis, onSelesai }: { awal?: Pemasok; jenis: JenisPemasok; onSelesai: () => void }) {
  const [kt, setKt] = useState<Record<string, NilaiKolom>>(awal?.kolom_tambahan ?? {});
  const aksi = useAksi();
  const { f, bind } = useFields({
    nama: awal?.nama ?? "", jenis: awal?.jenis ?? jenis, kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "",
    nama_bank: awal?.nama_bank ?? "", no_rekening: awal?.no_rekening ?? "", atas_nama: awal?.atas_nama ?? "", kontak: awal?.kontak ?? "",
  });
  return (
    <Formulir
      onKirim={() => {
        const body = { ...f, nama: f.nama.trim(), kolom_tambahan: kt };
        aksi.mutate(awal ? { path: `/pemasok/${awal.id}`, method: "PATCH", body } : { path: "/pemasok", body }, { onSuccess: onSelesai });
      }}
    >
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="Nama">
          <Input aria-label="Nama" required {...bind("nama")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Jenis">
          <Select disabled {...bind("jenis")}>
            <option value="tukang_kayu">Tukang (kayu)</option>
            <option value="supplier">Supplier (non kayu)</option>
          </Select>
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kode rekap" hint="Kosong = otomatis berurutan. Tampil di nomor rekap pembayaran, mis. 005">
          <Input {...bind("kode")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Nomor WhatsApp" hint="mis. 0812xxxx; untuk tombol Kirim rekap">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Bank">
          <Input {...bind("nama_bank")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Nomor rekening">
          <Input inputMode="numeric" {...bind("no_rekening")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Atas nama">
          <Input {...bind("atas_nama")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
</Col>
      </Row>
      <IsianKolomTambahan entitas="pemasok" nilai={kt} onUbah={setKt} />
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
        Simpan
      </Button>
      </AksiForm>
    </Formulir>
  );
}

/** Data master: tab Tukang dan tab Supplier memakai entitas pemasok yang sama, dibedakan `jenis`. */
export default function MasterPemasok({ jenis }: { jenis: JenisPemasok }) {
  const q = usePemasok();
  const label = LABEL_JENIS[jenis] ?? jenis;
  const data = (q.data ?? []).filter((p) => p.jenis === jenis);
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const [form, setForm] = useState<Pemasok | "baru" | null>(null);
  const kolom: TableColumnsType<Pemasok> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => (v === "tukang_kayu" ? <Lencana warna="hijau">Tukang</Lencana> : <Lencana>Supplier</Lencana>) },
    { title: "Kode rekap", dataIndex: "kode", render: (v: string) => v || "—" },
    { title: "WhatsApp", dataIndex: "no_wa", render: (v: string) => v || <Typography.Text type="warning">belum diisi</Typography.Text> },
    { title: "Rekening", render: (_, p) => (p.no_rekening ? `${p.nama_bank} ${p.no_rekening}` : "—") },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <Space size={0}>
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => void konfirmasi(`Nonaktifkan ${p.nama}?`, { ok: "Nonaktifkan", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/pemasok/${p.id}`, method: "PATCH", body: { aktif: false } }))}>
            Nonaktifkan
          </TombolLink>
        </Space>
      ),
    },
  ];
  return (
    <Card judul={label} aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> {label}</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={data} rowKey="id" minLebar={820} kosong={`Belum ada ${label.toLowerCase()}.`} />}
      {form && (
        <Dialog judul={form === "baru" ? `${label} baru` : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} jenis={jenis} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
