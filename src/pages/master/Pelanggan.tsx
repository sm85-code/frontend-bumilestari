import { Col, Row, Space, Typography } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Memuat, Teks, TombolLink, useDialog } from "../../components/ui";
import { useAksi, usePelanggan } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pelanggan } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Pelanggan; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "", kontak: awal?.kontak ?? "", alamat: awal?.alamat ?? "", catatan: awal?.catatan ?? "" });
  return (
    <Formulir
      onKirim={() => {
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pelanggan/${awal.id}`, method: "PATCH", body } : { path: "/pelanggan", body }, { onSuccess: onSelesai });
      }}
    >
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="Nama penjual">
          <Input required {...bind("nama")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kode invoice" hint="Kosong = otomatis berurutan. Tampil di nomor invoice, mis. 002">
          <Input {...bind("kode")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Nomor WhatsApp" hint="Untuk tombol Kirim invoice">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
</Col>
      </Row>
      <Field label="Alamat" hint="Tercetak di invoice">
        <Teks {...bind("alamat")} />
      </Field>
      <Field label="Catatan">
        <Input {...bind("catatan")} />
      </Field>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
        Simpan
      </Button>
      </AksiForm>
    </Formulir>
  );
}

export default function MasterPelanggan() {
  const q = usePelanggan();
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const [form, setForm] = useState<Pelanggan | "baru" | null>(null);
  const kolom: TableColumnsType<Pelanggan> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Kode invoice", dataIndex: "kode", render: (v: string) => v || "—" },
    { title: "WhatsApp", dataIndex: "no_wa", render: (v: string) => v || <Typography.Text type="warning">belum diisi</Typography.Text> },
    { title: "Alamat", dataIndex: "alamat", render: (v: string) => <Typography.Text type="secondary">{v || "—"}</Typography.Text> },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <Space size={0}>
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => void konfirmasi(`Nonaktifkan ${p.nama}?`, { ok: "Nonaktifkan", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/pelanggan/${p.id}`, method: "PATCH", body: { aktif: false } }))}>
            Nonaktifkan
          </TombolLink>
        </Space>
      ),
    },
  ];
  return (
    <Card judul="Penjual lain" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Penjual lain</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={700} kosong="Belum ada penjual lain." />}
      {form && (
        <Dialog judul={form === "baru" ? "Penjual lain baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
