import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Card, DataTabel, Dialog, ErrorBox, Field, Input, Lencana, Memuat, Select, TombolLink } from "../../components/ui";
import { useAksi, useProduk } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num, rp } from "../../lib/format";
import type { Produk } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Produk; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({
    sku: awal?.sku ?? "", nama: awal?.nama ?? "", jenis_produk: awal?.jenis_produk ?? "kayu", ukuran: awal?.ukuran ?? "",
    harga_jual: awal ? String(Math.round(num(awal.harga_jual))) : "", biaya: awal ? String(Math.round(num(awal.biaya_pokok_default))) : "",
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const umum = { nama: f.nama.trim(), ukuran: f.ukuran.trim(), harga_jual: bersihkanAngka(f.harga_jual) || "0", biaya_pokok_default: bersihkanAngka(f.biaya) || "0" };
        aksi.mutate(
          awal ? { path: `/produk/${awal.id}`, method: "PATCH", body: umum } : { path: "/produk", body: { ...umum, sku: f.sku.trim(), jenis_produk: f.jenis_produk } },
          { onSuccess: onSelesai },
        );
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="SKU">
          <Input required disabled={!!awal} {...bind("sku")} />
        </Field>
        <Field label="Jenis">
          <Select disabled={!!awal} {...bind("jenis_produk")}>
            <option value="kayu">Kayu</option>
            <option value="non_kayu">Non kayu (dibeli dari supplier)</option>
          </Select>
        </Field>
        <Field label="Nama barang" hint="Varian ditulis di nama, mis. [2 rak]">
          <Input required {...bind("nama")} />
        </Field>
        <Field label="Ukuran" hint="mis. 150x20x200">
          <Input {...bind("ukuran")} />
        </Field>
        <Field label="Harga jual (Rp)">
          <Input inputMode="numeric" required {...bind("harga_jual")} />
        </Field>
        <Field label="Biaya ke pemasok (Rp)" hint="Bahan + jasa (kayu) atau harga beli (non kayu)">
          <Input inputMode="numeric" {...bind("biaya")} />
        </Field>
      </div>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterProduk() {
  const q = useProduk();
  const aksi = useAksi();
  const [form, setForm] = useState<Produk | "baru" | null>(null);
  const angka = (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span>;
  const kolom: TableColumnsType<Produk> = [
    { title: "SKU", dataIndex: "sku", fixed: "left", width: 110 },
    { title: "Nama", dataIndex: "nama" },
    { title: "Jenis", dataIndex: "jenis_produk", render: (v: string) => (v === "kayu" ? <Lencana warna="hijau">kayu</Lencana> : <Lencana>non kayu</Lencana>) },
    { title: "Ukuran", dataIndex: "ukuran", render: (v: string) => v || "—" },
    { title: "Harga jual", dataIndex: "harga_jual", align: "right", render: angka },
    { title: "Biaya pemasok", dataIndex: "biaya_pokok_default", align: "right", render: angka },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <span className="whitespace-nowrap">
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => window.confirm(`Nonaktifkan ${p.sku}?`) && aksi.mutate({ path: `/produk/${p.id}`, method: "PATCH", body: { aktif: false } })}>
            Nonaktifkan
          </TombolLink>
        </span>
      ),
    },
  ];
  return (
    <Card judul="Katalog produk" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Produk</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={800} kosong="Belum ada produk." />}
      {form && (
        <Dialog judul={form === "baru" ? "Produk baru" : `Ubah ${form.sku}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
