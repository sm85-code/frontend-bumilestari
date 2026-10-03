import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BagikanWA from "../components/BagikanWA";
import type { TableColumnsType } from "antd";
import { BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Input, Kosong, Lencana, Memuat, PageHeader, TombolLink } from "../components/ui";
import { api, apiUrl, query } from "../lib/api";
import { peta, usePelanggan, useAksi } from "../lib/data";
import { hariIni, rp, tanggal } from "../lib/format";
import type { Invoice, PenerimaanReseller } from "../lib/types";

export default function PenjualLain() {
  const [tgl, setTgl] = useState(hariIni());
  const invQ = useQuery({ queryKey: ["invoice", tgl], queryFn: () => api<Invoice[]>(`/invoice-reseller${query({ tanggal: tgl })}`) });
  const terimaQ = useQuery({ queryKey: ["penerimaan"], queryFn: () => api<PenerimaanReseller[]>("/penerimaan-reseller") });
  const pelanggan = peta(usePelanggan().data);
  const aksi = useAksi();

  function catatBayar(inv: Invoice) {
    if (!window.confirm(`Catat pembayaran ${rp(inv.grand_total)} dari ${inv.kepada.nama} (${inv.items.length} order)?`)) return;
    aksi.mutate({
      path: "/penerimaan-reseller",
      body: { pelanggan_id: inv.kepada.pelanggan_id, tanggal: hariIni(), order_ids: inv.items.map((i) => i.order_id) },
    });
  }

  const angka = (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span>;
  const kolomInvoice: TableColumnsType<Invoice["items"][number]> = [
    {
      title: "Tanggal",
      fixed: "left",
      width: 130,
      render: (_, i) => (
        <span className="whitespace-nowrap">
          {tanggal(i.tanggal)} {i.terlambat && <Lencana warna="oranye">terlambat</Lencana>}
        </span>
      ),
    },
    { title: "Nama barang", dataIndex: "nama_barang" },
    { title: "Ukuran", dataIndex: "ukuran", width: 120 },
    { title: "Harga barang", dataIndex: "harga_barang", align: "right", render: angka },
    { title: "Jasa pengecatan", dataIndex: "biaya_jasa_pengecatan", align: "right", render: angka },
    { title: "Biaya proses", dataIndex: "biaya_proses", align: "right", render: angka },
    { title: "Total", dataIndex: "total", align: "right", render: (v: string) => <b className="tabular-nums whitespace-nowrap">{rp(v)}</b> },
  ];
  const kolomTerima: TableColumnsType<PenerimaanReseller> = [
    { title: "Tanggal", dataIndex: "tanggal", fixed: "left", width: 110, render: (v: string) => <span className="whitespace-nowrap">{tanggal(v)}</span> },
    { title: "Penjual", dataIndex: "pelanggan_id", render: (v: string) => pelanggan.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "total", align: "right", render: angka },
    { title: "Status", dataIndex: "dibatalkan", render: (v: boolean) => (v ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">diterima</Lencana>) },
    {
      title: "Aksi",
      width: 100,
      render: (_, p) =>
        !p.dibatalkan && (
          <TombolLink
            bahaya
            onClick={() => {
              const alasan = window.prompt("Alasan membatalkan pembayaran ini?");
              if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/penerimaan-reseller/${p.id}/batal`, body: { alasan: alasan.trim() } });
            }}
          >
            Batalkan
          </TombolLink>
        ),
    },
  ];

  return (
    <>
      <PageHeader judul="Penjual lain" sub="Invoice mingguan dan pembayaran yang diterima" />
      <Card>
        <div className="max-w-xs">
          <Field label="Tanggal acuan" hint="Invoice minggu sebelum Selasa acuan: bertanggal Sabtu, jatuh tempo Selasa">
            <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
          </Field>
        </div>
      </Card>
      <ErrorBox error={invQ.error ?? aksi.error} />
      {invQ.isLoading && <Memuat />}
      {invQ.data?.length === 0 && <Kosong teks="Tidak ada tagihan penjual lain." />}
      {invQ.data?.map((inv) => (
        <Card
          key={inv.nomor}
          judul={`${inv.kepada.nama} · ${inv.nomor}`}
          aksi={
            <span className="flex flex-wrap items-center gap-2">
              <a className="text-sm font-semibold text-hijau hover:underline" href={apiUrl(`/invoice-reseller/${inv.kepada.pelanggan_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                PDF invoice
              </a>
              <BagikanWA jenis="invoice" id={inv.kepada.pelanggan_id} tanggal={tgl} label="Kirim invoice" />
            </span>
          }
        >
          <p className="mb-2 text-xs text-stone-600">
            {inv.minggu.label} · tanggal invoice {tanggal(inv.tgl_invoice)} · jatuh tempo <b>{tanggal(inv.jatuh_tempo)}</b>
          </p>
          <DataTabel
            kolom={kolomInvoice}
            data={inv.items}
            rowKey="order_id"
            minLebar={800}
            ringkasan={() => (
              <BarisTotal
                sel={[
                  { isi: "Grand total", span: 3 },
                  { isi: rp(inv.total_barang), kanan: true },
                  { isi: rp(inv.total_jasa_pengecatan), kanan: true },
                  { isi: rp(inv.total_biaya_proses), kanan: true },
                  { isi: rp(inv.grand_total), kanan: true },
                ]}
              />
            )}
          />
          <div className="mt-3 flex justify-end">
            <Button disabled={aksi.isPending} onClick={() => catatBayar(inv)}>
              Catat pembayaran diterima
            </Button>
          </div>
        </Card>
      ))}

      <Card judul="Riwayat pembayaran diterima">
        <DataTabel kolom={kolomTerima} data={terimaQ.data ?? []} rowKey="id" minLebar={520} kosong="Belum ada pembayaran." />
      </Card>
    </>
  );
}
