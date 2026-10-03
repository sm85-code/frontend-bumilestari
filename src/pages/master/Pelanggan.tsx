import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Card, DataTabel, Dialog, ErrorBox, Field, Input, Memuat, Teks, TombolLink } from "../../components/ui";
import { useAksi, usePelanggan } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pelanggan } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Pelanggan; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "", kontak: awal?.kontak ?? "", alamat: awal?.alamat ?? "", catatan: awal?.catatan ?? "" });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pelanggan/${awal.id}`, method: "PATCH", body } : { path: "/pelanggan", body }, { onSuccess: onSelesai });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nama penjual">
          <Input required {...bind("nama")} />
        </Field>
        <Field label="Kode invoice" hint="Kosong = otomatis berurutan. Tampil di nomor invoice, mis. 002">
          <Input {...bind("kode")} />
        </Field>
        <Field label="Nomor WhatsApp" hint="Untuk tombol Kirim invoice">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
      </div>
      <Field label="Alamat" hint="Tercetak di invoice">
        <Teks {...bind("alamat")} />
      </Field>
      <Field label="Catatan">
        <Input {...bind("catatan")} />
      </Field>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterPelanggan() {
  const q = usePelanggan();
  const aksi = useAksi();
  const [form, setForm] = useState<Pelanggan | "baru" | null>(null);
  const kolom: TableColumnsType<Pelanggan> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Kode invoice", dataIndex: "kode", render: (v: string) => v || "—" },
    { title: "WhatsApp", dataIndex: "no_wa", render: (v: string) => v || <span className="text-oranye">belum diisi</span> },
    { title: "Alamat", dataIndex: "alamat", render: (v: string) => <span className="text-coklat">{v || "—"}</span> },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <span className="whitespace-nowrap">
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => window.confirm(`Nonaktifkan ${p.nama}?`) && aksi.mutate({ path: `/pelanggan/${p.id}`, method: "PATCH", body: { aktif: false } })}>
            Nonaktifkan
          </TombolLink>
        </span>
      ),
    },
  ];
  return (
    <Card judul="Penjual lain (pemesan)" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Penjual</Button>}>
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
