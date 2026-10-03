import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import FormOrder from "../components/FormOrder";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Card, DataTabel, Dialog, ErrorBox, Field, Lencana, Memuat, PageHeader, Select, TombolLink } from "../components/ui";
import { api, query } from "../lib/api";
import { peta, useAksi, usePelanggan, usePemasok, useProduk, useSaluran } from "../lib/data";
import { rp, tanggal } from "../lib/format";
import { LABEL_STATUS, statusBerikut } from "../lib/order";
import type { Order, StatusOrder } from "../lib/types";

const WARNA: Record<StatusOrder, "hijau" | "oranye" | "merah" | "abu"> = {
  dipesan: "abu", dikerjakan: "oranye", diambil: "oranye", diterima: "oranye", dicat: "oranye", dikirim: "hijau", selesai: "hijau", batal: "merah",
};

export default function OrderPage() {
  const [status, setStatus] = useState("");
  const [jenis, setJenis] = useState("");
  const [tambah, setTambah] = useState(false);
  const q = useQuery({
    queryKey: ["order", status, jenis],
    queryFn: () => api<Order[]>(`/order${query({ status_order: status, jenis_produk: jenis })}`),
  });
  const produkQ = useProduk();
  const pemasokQ = usePemasok();
  const saluranQ = useSaluran();
  const pelangganQ = usePelanggan();
  const aksi = useAksi();
  const produk = peta(produkQ.data);
  const pemasok = peta(pemasokQ.data);
  const saluran = peta(saluranQ.data);
  const pelanggan = peta(pelangganQ.data);

  function majukan(o: Order, berikut: StatusOrder) {
    if (!o.pemasok_id && (berikut === "dikerjakan" || berikut === "diterima")) {
      window.alert("Pilih tukang/supplier dulu sebelum order dikerjakan.");
      return;
    }
    aksi.mutate({ path: `/order/${o.id}/status`, body: { status: berikut } });
  }

  const redup = (t: React.ReactNode) => <span className="block text-xs text-coklat">{t}</span>;
  const kolom: TableColumnsType<Order> = [
    {
      title: "Tanggal / kode",
      fixed: "left",
      width: 135,
      render: (_, o) => (
        <>
          <span className="whitespace-nowrap">{tanggal(o.tanggal_order)}</span>
          {redup(o.no_order || "—")}
        </>
      ),
    },
    {
      title: "Barang",
      width: 190,
      render: (_, o) => {
        const p = produk.get(o.produk_id);
        return (
          <>
            <b>{p?.nama ?? "—"}</b> <span className="text-coklat">{p?.ukuran}</span>
            {o.warna && redup(`Warna: ${o.warna}`)}
            {!o.butuh_cat && p?.jenis_produk === "kayu" && <Lencana>polos</Lencana>}
          </>
        );
      },
    },
    {
      title: "Saluran",
      width: 135,
      render: (_, o) => (
        <>
          {saluran.get(o.saluran_id)?.nama}
          {redup(o.pelanggan_id ? pelanggan.get(o.pelanggan_id)?.nama : o.nama_pembeli)}
        </>
      ),
    },
    { title: "Pemasok", width: 120, render: (_, o) => (o.pemasok_id ? pemasok.get(o.pemasok_id)?.nama : <span className="text-oranye">belum dipilih</span>) },
    {
      title: "Total",
      align: "right",
      width: 165,
      render: (_, o) => (
        <>
          <b className="tabular-nums whitespace-nowrap">{rp(o.total_penjualan)}</b>
          {redup(`biaya ${rp(o.biaya_pokok)} · laba ${rp(o.laba_kotor)}`)}
        </>
      ),
    },
    {
      title: "Status dan aksi",
      width: 215,
      render: (_, o) => {
        const berikut = statusBerikut(o, produk.get(o.produk_id)?.jenis_produk ?? "kayu");
        return (
          <>
            <Lencana warna={WARNA[o.status]}>{LABEL_STATUS[o.status]}</Lencana>
            {berikut && (
              <span className="mt-1 flex flex-wrap">
                <TombolLink disabled={aksi.isPending} onClick={() => majukan(o, berikut)}>
                  → {LABEL_STATUS[berikut]}
                </TombolLink>
                <TombolLink bahaya onClick={() => window.confirm("Batalkan order ini?") && aksi.mutate({ path: `/order/${o.id}/status`, body: { status: "batal" } })}>
                  Batalkan
                </TombolLink>
              </span>
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        judul="Order"
        aksi={
          <Button onClick={() => setTambah(true)}>
            <PlusOutlined /> Order baru
          </Button>
        }
      />
      <Card>
        <div className="grid max-w-md grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              {(Object.keys(LABEL_STATUS) as StatusOrder[]).map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jenis produk">
            <Select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="">Semua</option>
              <option value="kayu">Kayu</option>
              <option value="non_kayu">Non kayu</option>
            </Select>
          </Field>
        </div>
      </Card>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={940} kosong="Belum ada order." />}
      {tambah && (
        <Dialog judul="Order baru" onTutup={() => setTambah(false)}>
          <FormOrder onSelesai={() => setTambah(false)} />
        </Dialog>
      )}
    </>
  );
}
