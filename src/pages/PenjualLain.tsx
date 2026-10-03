import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BagikanWA from "../components/BagikanWA";
import { Card, ErrorBox, Field, Input, Kosong, Button, Lencana, Memuat, Tabel, Td, TdTotal, Th } from "../components/ui";
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

  return (
    <>
      <h1 className="text-lg font-bold">Penjual lain</h1>
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
              <a className="text-xs font-semibold text-hijau hover:underline" href={apiUrl(`/invoice-reseller/${inv.kepada.pelanggan_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                PDF invoice
              </a>
              <BagikanWA jenis="invoice" id={inv.kepada.pelanggan_id} tanggal={tgl} label="Kirim invoice" />
            </span>
          }
        >
          <p className="mb-2 text-xs text-stone-600">
            {inv.minggu.label} · tanggal invoice {tanggal(inv.tgl_invoice)} · jatuh tempo <b>{tanggal(inv.jatuh_tempo)}</b>
          </p>
          <Tabel minLebar={760}>
            <thead>
              <tr>
                <Th lengket>Tanggal</Th>
                <Th>Nama barang</Th>
                <Th>Ukuran</Th>
                <Th kanan>Harga barang</Th>
                <Th kanan>Jasa pengecatan</Th>
                <Th kanan>Biaya proses</Th>
                <Th kanan>Total</Th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((i) => (
                <tr key={i.order_id}>
                  <Td lengket className="whitespace-nowrap">
                    {tanggal(i.tanggal)} {i.terlambat && <Lencana warna="oranye">terlambat</Lencana>}
                  </Td>
                  <Td>{i.nama_barang}</Td>
                  <Td>{i.ukuran}</Td>
                  <Td kanan>{rp(i.harga_barang)}</Td>
                  <Td kanan>{rp(i.biaya_jasa_pengecatan)}</Td>
                  <Td kanan>{rp(i.biaya_proses)}</Td>
                  <Td kanan>{rp(i.total)}</Td>
                </tr>
              ))}
              <tr>
                <TdTotal lengket colSpan={3}>Grand total</TdTotal>
                <TdTotal kanan>{rp(inv.total_barang)}</TdTotal>
                <TdTotal kanan>{rp(inv.total_jasa_pengecatan)}</TdTotal>
                <TdTotal kanan>{rp(inv.total_biaya_proses)}</TdTotal>
                <TdTotal kanan>{rp(inv.grand_total)}</TdTotal>
              </tr>
            </tbody>
          </Tabel>
          <div className="mt-3 flex justify-end">
            <Button disabled={aksi.isPending} onClick={() => catatBayar(inv)}>
              Catat pembayaran diterima
            </Button>
          </div>
        </Card>
      ))}

      <Card judul="Riwayat pembayaran diterima">
        {!terimaQ.data?.length ? (
          <Kosong teks="Belum ada pembayaran." />
        ) : (
          <Tabel minLebar={460}>
            <thead>
              <tr>
                <Th lengket>Tanggal</Th>
                <Th>Penjual</Th>
                <Th kanan>Jumlah</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {terimaQ.data.map((p) => (
                <tr key={p.id}>
                  <Td lengket>{tanggal(p.tanggal)}</Td>
                  <Td>{pelanggan.get(p.pelanggan_id)?.nama ?? "—"}</Td>
                  <Td kanan>{rp(p.total)}</Td>
                  <Td>{p.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">diterima</Lencana>}</Td>
                  <Td>
                    {!p.dibatalkan && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          const alasan = window.prompt("Alasan membatalkan pembayaran ini?");
                          if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/penerimaan-reseller/${p.id}/batal`, body: { alasan: alasan.trim() } });
                        }}
                      >
                        Batalkan
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabel>
        )}
      </Card>
    </>
  );
}
