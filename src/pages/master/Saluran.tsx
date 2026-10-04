import { Space } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Memuat, Select, TombolLink, useDialog } from "../../components/ui";
import { peta, useAkun, useAksi, useSaluran } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Saluran } from "../../lib/types";

const JENIS = { marketplace: "Marketplace", web: "Toko web sendiri", reseller: "Penjual lain" } as const;

function Form({ awal, onSelesai }: { awal?: Saluran; onSelesai: () => void }) {
  const aksi = useAksi();
  const akunQ = useAkun();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", jenis: awal?.jenis ?? "marketplace", akun_id: awal?.akun_id ?? "" });
  return (
    <Formulir
      onKirim={() => {
        const body = { nama: f.nama.trim(), akun_id: f.akun_id || null };
        aksi.mutate(awal ? { path: `/saluran/${awal.id}`, method: "PATCH", body } : { path: "/saluran", body: { ...body, jenis: f.jenis } }, { onSuccess: onSelesai });
      }}
    >
      <Field label="Nama saluran" hint="mis. Shopee, Tokopedia, Toko web">
        <Input required {...bind("nama")} />
      </Field>
      <Field label="Jenis">
        <Select disabled={!!awal} {...bind("jenis")}>
          {Object.entries(JENIS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Akun tujuan dana" hint="Saldo toko tempat uang saluran ini masuk">
        <Select {...bind("akun_id")}>
          <option value="">—</option>
          {(akunQ.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama}
            </option>
          ))}
        </Select>
      </Field>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
        Simpan
      </Button>
      </AksiForm>
    </Formulir>
  );
}

export default function MasterSaluran() {
  const q = useSaluran();
  const akun = peta(useAkun().data);
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const [form, setForm] = useState<Saluran | "baru" | null>(null);
  const kolom: TableColumnsType<Saluran> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 150 },
    { title: "Jenis", dataIndex: "jenis", render: (v: keyof typeof JENIS) => <Lencana>{JENIS[v]}</Lencana> },
    { title: "Akun tujuan", dataIndex: "akun_id", render: (v: string | null) => (v ? akun.get(v)?.nama : "—") },
    {
      title: "Aksi",
      width: 170,
      render: (_, sl) => (
        <Space size={0}>
          <TombolLink onClick={() => setForm(sl)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => void konfirmasi(`Nonaktifkan ${sl.nama}?`, { ok: "Nonaktifkan", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/saluran/${sl.id}`, method: "PATCH", body: { aktif: false } }))}>
            Nonaktifkan
          </TombolLink>
        </Space>
      ),
    },
  ];
  return (
    <Card judul="Saluran penjualan" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Saluran</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={720} kosong="Belum ada saluran." />}
      {form && (
        <Dialog judul={form === "baru" ? "Saluran baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
