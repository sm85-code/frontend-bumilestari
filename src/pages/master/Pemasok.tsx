import { Col, Row, Space, Typography } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Memuat, Select, TombolLink, useDialog } from "../../components/ui";
import { useAksi, usePemasok } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pemasok } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Pemasok; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({
    nama: awal?.nama ?? "", jenis: awal?.jenis ?? "tukang_kayu", kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "",
    nama_bank: awal?.nama_bank ?? "", no_rekening: awal?.no_rekening ?? "", atas_nama: awal?.atas_nama ?? "", kontak: awal?.kontak ?? "",
  });
  return (
    <Formulir
      onKirim={() => {
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pemasok/${awal.id}`, method: "PATCH", body } : { path: "/pemasok", body }, { onSuccess: onSelesai });
      }}
    >
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="Nama">
          <Input required {...bind("nama")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Jenis">
          <Select disabled={!!awal} {...bind("jenis")}>
            <option value="tukang_kayu">Tukang kayu</option>
            <option value="supplier">Supplier (non kayu)</option>
          </Select>
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kode PO" hint="Kosong = otomatis berurutan. Tampil di nomor PO, mis. 005">
          <Input {...bind("kode")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Nomor WhatsApp" hint="mis. 0812xxxx; untuk tombol Kirim PO">
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
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
        Simpan
      </Button>
      </AksiForm>
    </Formulir>
  );
}

export default function MasterPemasok() {
  const q = usePemasok();
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const [form, setForm] = useState<Pemasok | "baru" | null>(null);
  const kolom: TableColumnsType<Pemasok> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => (v === "tukang_kayu" ? <Lencana warna="hijau">Tukang kayu</Lencana> : <Lencana>Supplier</Lencana>) },
    { title: "Kode PO", dataIndex: "kode", render: (v: string) => v || "—" },
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
    <Card judul="Tukang kayu dan supplier" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Tukang/supplier</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={820} kosong="Belum ada data." />}
      {form && (
        <Dialog judul={form === "baru" ? "Tukang/supplier baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
