import { Col, Row, Space } from "antd";
import { kolomTabelTambahan, useDefinisiKolom } from "../../lib/kolom";
import IsianKolomTambahan from "../../components/IsianKolomTambahan";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Angka, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Memuat, Select, TombolLink, useDialog } from "../../components/ui";
import { useAksi, useProduk } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num, rp } from "../../lib/format";
import type { Produk, NilaiKolom } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Produk; onSelesai: () => void }) {
  const [kt, setKt] = useState<Record<string, NilaiKolom>>(awal?.kolom_tambahan ?? {});
  const aksi = useAksi();
  const { f, bind } = useFields({
    sku: awal?.sku ?? "", nama: awal?.nama ?? "", jenis_produk: awal?.jenis_produk ?? "kayu", ukuran: awal?.ukuran ?? "",
    harga_jual: awal?.harga_jual ? String(Math.round(num(awal.harga_jual))) : "", biaya: awal ? String(Math.round(num(awal.biaya_pokok_default))) : "",
  });
  return (
    <Formulir
      onKirim={() => {
        const umum = { kolom_tambahan: kt, nama: f.nama.trim(), ukuran: f.ukuran.trim(), harga_jual: bersihkanAngka(f.harga_jual) || null, biaya_pokok_default: bersihkanAngka(f.biaya) || "0" };
        aksi.mutate(
          awal ? { path: `/produk/${awal.id}`, method: "PATCH", body: umum } : { path: "/produk", body: { ...umum, sku: f.sku.trim(), jenis_produk: f.jenis_produk } },
          { onSuccess: onSelesai },
        );
      }}
    >
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="SKU">
          <Input aria-label="SKU" required disabled={!!awal} {...bind("sku")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Jenis">
          <Select disabled={!!awal} {...bind("jenis_produk")}>
            <option value="kayu">Kayu</option>
            <option value="non_kayu">Non kayu (dibeli dari supplier)</option>
          </Select>
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Nama barang" hint="Varian ditulis di nama, mis. [2 rak]">
          <Input aria-label="Nama barang" required {...bind("nama")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Ukuran" hint="mis. 150x20x200">
          <Input {...bind("ukuran")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Harga acuan (opsional)" hint="Untuk marketplace, harga final mengikuti file penghasilan.">
          <Input aria-label="Harga acuan" inputMode="numeric" placeholder="Boleh kosong" {...bind("harga_jual")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Harga beli (Rp)" hint="Harga barang + jasa tukang/supplier (total yang dibayar untuk 1 barang siap jual)">
          <Input inputMode="numeric" {...bind("biaya")} />
        </Field>
</Col>
      </Row>
      <IsianKolomTambahan entitas="produk" nilai={kt} onUbah={setKt} />
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
        Simpan
      </Button>
      </AksiForm>
    </Formulir>
  );
}

export default function MasterProduk() {
  const q = useProduk();
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const [form, setForm] = useState<Produk | "baru" | null>(null);
  const angka = (v: string) => <Angka>{rp(v)}</Angka>;
  const ktKolom = kolomTabelTambahan<Produk>(useDefinisiKolom("produk").data);
  const kolom: TableColumnsType<Produk> = [
    { title: "SKU", dataIndex: "sku", fixed: "left", width: 110 },
    { title: "Nama", dataIndex: "nama" },
    { title: "Jenis", dataIndex: "jenis_produk", render: (v: string) => (v === "kayu" ? <Lencana warna="hijau">Kayu</Lencana> : <Lencana>Non kayu</Lencana>) },
    { title: "Ukuran", dataIndex: "ukuran", render: (v: string) => v || "—" },
    { title: "Harga acuan", dataIndex: "harga_jual", align: "right", render: (v: string | null) => (v === null || v === "" ? "—" : angka(v)) },
    { title: "Harga beli", dataIndex: "biaya_pokok_default", align: "right", render: angka },
    {
      title: "Aksi",
      width: 170,
      render: (_, p) => (
        <Space size={0}>
          <TombolLink onClick={() => setForm(p)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => void konfirmasi(`Nonaktifkan ${p.sku}?`, { ok: "Nonaktifkan", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/produk/${p.id}`, method: "PATCH", body: { aktif: false } }))}>
            Nonaktifkan
          </TombolLink>
        </Space>
      ),
    },
  ];
  return (
    <Card judul="Katalog produk" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Produk</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={[...kolom.slice(0, -1), ...ktKolom, ...kolom.slice(-1)]} data={q.data ?? []} rowKey="id" minLebar={800 + ktKolom.length * 120} kosong="Belum ada produk." />}
      {form && (
        <Dialog judul={form === "baru" ? "Produk baru" : `Ubah ${form.sku}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
