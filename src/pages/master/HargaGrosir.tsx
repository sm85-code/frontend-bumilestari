import { Col, Row, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { TableColumnsType } from "antd";
import { AksiForm, Angka, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Kosong, Select, TombolLink } from "../../components/ui";
import { api, query } from "../../lib/api";
import { useAksi, usePelanggan, useProduk } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num, rp } from "../../lib/format";
import type { HargaGrosir, Produk } from "../../lib/types";

function Form({ produk, pelangganId, awal, onSelesai }: { produk: Produk; pelangganId: string; awal?: HargaGrosir; onSelesai: () => void }) {
  const aksi = useAksi();
  const angka = (v?: string) => (v ? String(Math.round(num(v))) : "");
  const { f, bind } = useFields({ harga: angka(awal?.harga), cat: angka(awal?.harga_cat_jasa), biasa: angka(awal?.harga_packing_biasa), kayu: angka(awal?.harga_packing_kayu) });
  return (
    <Formulir
      onKirim={() => {
        aksi.mutate(
          {
            path: "/harga-grosir",
            method: "PUT",
            body: {
              produk_id: produk.id, pelanggan_id: pelangganId, harga: bersihkanAngka(f.harga) || "0",
              harga_cat_jasa: bersihkanAngka(f.cat) || "0", harga_packing_biasa: bersihkanAngka(f.biasa) || "0", harga_packing_kayu: bersihkanAngka(f.kayu) || "0",
            },
          },
          { onSuccess: onSelesai },
        );
      }}
    >
      <Typography.Paragraph type="secondary">
        {produk.sku} · {produk.nama} {produk.ukuran}. Semua harga per unit; cat/jasa mengikuti ukuran barang. Biaya proses pesanan flat (diatur di Profil).
      </Typography.Paragraph>
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="Harga barang (Rp)">
          <Input inputMode="numeric" required {...bind("harga")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Cat dan jasa (Rp)" hint="0 untuk produk non kayu">
          <Input inputMode="numeric" {...bind("cat")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Packing biasa (Rp)">
          <Input inputMode="numeric" {...bind("biasa")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Packing kayu (Rp)">
          <Input inputMode="numeric" {...bind("kayu")} />
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

export default function MasterHargaGrosir() {
  const pelangganQ = usePelanggan();
  const produkQ = useProduk();
  const [pilih, setPilih] = useState("");
  const [edit, setEdit] = useState<Produk | null>(null);
  const pelangganId = pilih || pelangganQ.data?.[0]?.id || "";
  const hargaQ = useQuery({
    queryKey: ["harga-grosir", pelangganId],
    queryFn: () => api<HargaGrosir[]>(`/harga-grosir${query({ pelanggan_id: pelangganId })}`),
    enabled: !!pelangganId,
  });
  const harga = new Map((hargaQ.data ?? []).map((h) => [h.produk_id, h]));
  const sel = (ambil: (h: HargaGrosir) => string) => (_: unknown, p: Produk) => {
    const h = harga.get(p.id);
    return h ? <Angka>{rp(ambil(h))}</Angka> : "—";
  };
  const kolom: TableColumnsType<Produk> = [
    { title: "Produk", fixed: "left", width: 230, render: (_, p) => <>{p.sku} · {p.nama}</> },
    { title: "Ukuran", dataIndex: "ukuran", render: (v: string) => v || "—" },
    { title: "Barang", align: "right", render: sel((h) => h.harga) },
    { title: "Cat + jasa", align: "right", render: sel((h) => h.harga_cat_jasa) },
    { title: "Packing biasa", align: "right", render: sel((h) => h.harga_packing_biasa) },
    { title: "Packing kayu", align: "right", render: sel((h) => h.harga_packing_kayu) },
    { title: "Aksi", width: 110, render: (_, p) => <TombolLink onClick={() => setEdit(p)}>{harga.get(p.id) ? "Ubah" : "Isi harga"}</TombolLink> },
  ];

  return (
    <Card judul="Harga grosir per penjual">
      <Row>
        <Col xs={24} md={8}>
          <Field label="Penjual">
            <Select value={pelangganId} onChange={(e) => setPilih(e.target.value)}>
              {(pelangganQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </Field>
        </Col>
      </Row>
      <ErrorBox error={hargaQ.error} />
      {!pelangganId ? (
        <Kosong teks="Tambahkan penjual lain dulu." />
      ) : (
        <DataTabel kolom={kolom} data={produkQ.data ?? []} rowKey="id" minLebar={860} />
      )}
      {edit && (
        <Dialog judul="Harga grosir" onTutup={() => setEdit(null)}>
          <Form produk={edit} pelangganId={pelangganId} awal={harga.get(edit.id)} onSelesai={() => setEdit(null)} />
        </Dialog>
      )}
    </Card>
  );
}
