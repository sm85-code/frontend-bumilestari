import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Select, Table, message } from "antd";
import { useState } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/ui";

type Belum = { nama: string; jumlah: number };
type Produk = { id: string; nama: string; jenis_produk: string; sku: string };

export default function PetaNamaPage() {
  const qc = useQueryClient();
  const [pilih, setPilih] = useState<Record<string, string>>({});
  const belum = useQuery({ queryKey: ["belum-peta"], queryFn: () => api<Belum[]>("/order/belum-peta") });
  const produk = useQuery({ queryKey: ["produk"], queryFn: () => api<Produk[]>("/produk") });
  const simpan = useMutation({
    mutationFn: (body: { nama: string; produk_id: string }) => api("/order/peta", { method: "POST", body }),
    onSuccess: (r: { order: number; jenis: string }) => {
      message.success(`${r.order} order dipetakan${r.jenis === "kayu" ? "" : ", tanpa cat"}`);
      void qc.invalidateQueries({ queryKey: ["belum-peta"] });
    },
  });
  const jenis = (produk.data ?? []).filter((p) => p.sku !== "ERP-BELUM");
  return (
    <>
      <PageHeader judul="Petakan barang" sub="Nama Shopee yang sama ikut sendiri. Yang beda, tunggu kamu cocokkan. Tidak digabung otomatis." />
      <Table
        rowKey="nama"
        loading={belum.isLoading}
        dataSource={belum.data ?? []}
        pagination={false}
        locale={{ emptyText: "Semua order sudah punya jenis." }}
        columns={[
          { title: "Nama di Shopee", dataIndex: "nama" },
          { title: "Order", dataIndex: "jumlah", width: 80 },
          {
            title: "Jenis katalog",
            render: (_, r) => (
              <Select
                style={{ minWidth: 220 }}
                placeholder="Pilih jenis"
                value={pilih[r.nama]}
                onChange={(v) => setPilih((s) => ({ ...s, [r.nama]: v }))}
                options={jenis.map((p) => ({ value: p.id, label: `${p.nama} · ${p.jenis_produk === "kayu" ? "kayu" : "non-kayu"}` }))}
              />
            ),
          },
          {
            title: "",
            width: 100,
            render: (_, r) => (
              <Button type="primary" disabled={!pilih[r.nama]} loading={simpan.isPending} onClick={() => simpan.mutate({ nama: r.nama, produk_id: pilih[r.nama] })}>
                Simpan
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
