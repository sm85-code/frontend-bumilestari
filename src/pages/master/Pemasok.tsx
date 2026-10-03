import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Card, DataTabel, Dialog, ErrorBox, Field, Input, Lencana, Memuat, Select, TombolLink } from "../../components/ui";
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
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pemasok/${awal.id}`, method: "PATCH", body } : { path: "/pemasok", body }, { onSuccess: onSelesai });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nama">
          <Input required {...bind("nama")} />
        </Field>
        <Field label="Jenis">
          <Select disabled={!!awal} {...bind("jenis")}>
            <option value="tukang_kayu">Tukang kayu</option>
            <option value="supplier">Supplier (non kayu)</option>
          </Select>
        </Field>
        <Field label="Kode PO" hint="Kosong = otomatis berurutan. Tampil di nomor PO, mis. 005">
          <Input {...bind("kode")} />
        </Field>
        <Field label="Nomor WhatsApp" hint="mis. 0812xxxx; untuk tombol Kirim PO">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
        <Field label="Bank">
          <Input {...bind("nama_bank")} />
        </Field>
        <Field label="Nomor rekening">
          <Input inputMode="numeric" {...bind("no_rekening")} />
        </Field>
        <Field label="Atas nama">
          <Input {...bind("atas_nama")} />
        </Field>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
      </div>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterPemasok() {
  const q = usePemasok();
  const aksi = useAksi();
  const [form, setForm] = useState<Pemasok | "baru" | null>(null);
  const kolom: TableColumnsType<Pemasok> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => (v === "tukang_kayu" ? <Lencana warna="hijau">tukang kayu</Lencana> : <Lencana>supplier</Lencana>) },
    { title: "Kode PO", dataIndex: "kode", render: (v: string) => v || "—" },
    { title: "WhatsApp", dataIndex: "no_wa", render: (v: string) => v || <span className="text-oranye">belum diisi</span> },
    { title: "Rekening", render: (_, p) => (p.no_rekening ? `${p.nama_bank} ${p.no_rekening}` : "—") },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <span className="whitespace-nowrap">
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => window.confirm(`Nonaktifkan ${p.nama}?`) && aksi.mutate({ path: `/pemasok/${p.id}`, method: "PATCH", body: { aktif: false } })}>
            Nonaktifkan
          </TombolLink>
        </span>
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
