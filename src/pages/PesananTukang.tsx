import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import BagikanWA from "../components/BagikanWA";
import { Button, Card, Dialog, ErrorBox, Field, Input, Kosong, Lencana, Memuat, Tabel, Td, TdTotal, Th } from "../components/ui";
import { api, apiUrl, query } from "../lib/api";
import { peta, useAksi, useProduk } from "../lib/data";
import { hariIni, rp, tanggal } from "../lib/format";
import type { PembayaranPemasok, RincianPembayaran, SiapBayar } from "../lib/types";

function Rincian({ id, onTutup }: { id: string; onTutup: () => void }) {
  const q = useQuery({ queryKey: ["pembayaran", id], queryFn: () => api<RincianPembayaran>(`/pembayaran-pemasok/${id}`) });
  return (
    <Dialog judul="Rincian pembayaran" onTutup={onTutup}>
      {q.isLoading && <Memuat />}
      <ErrorBox error={q.error} />
      {q.data && (
        <>
          <p className="mb-2 text-sm text-stone-600">
            Di laporan keuangan tampil sebagai <b>1 transaksi</b> {rp(q.data.total)}; isinya {q.data.total_qty} barang:
          </p>
          <Tabel minLebar={520}>
            <thead>
              <tr>
                <Th lengket>Kode pesanan</Th>
                <Th>Barang</Th>
                <Th>Pemasok</Th>
                <Th kanan>Qty</Th>
                <Th kanan>Jumlah</Th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((i) => (
                <tr key={i.order_id}>
                  <Td lengket>{i.no_order || "—"}</Td>
                  <Td>{i.produk_nama}</Td>
                  <Td>{i.pemasok_nama}</Td>
                  <Td kanan>{i.qty}</Td>
                  <Td kanan>{rp(i.jumlah)}</Td>
                </tr>
              ))}
              <tr>
                <TdTotal lengket colSpan={3}>Total</TdTotal>
                <TdTotal kanan>{q.data.total_qty}</TdTotal>
                <TdTotal kanan>{rp(q.data.total)}</TdTotal>
              </tr>
            </tbody>
          </Tabel>
        </>
      )}
    </Dialog>
  );
}

export default function PesananTukang() {
  const [tgl, setTgl] = useState(hariIni());
  const [lihat, setLihat] = useState<string | null>(null);
  const siapQ = useQuery({ queryKey: ["siap-bayar", tgl], queryFn: () => api<SiapBayar>(`/pembayaran-pemasok/siap${query({ tanggal: tgl })}`) });
  const riwayatQ = useQuery({ queryKey: ["pembayaran-pemasok"], queryFn: () => api<PembayaranPemasok[]>("/pembayaran-pemasok") });
  const produk = peta(useProduk().data);
  const aksi = useAksi();
  const siap = siapQ.data;

  function kirimKeLaporan() {
    if (!siap || !window.confirm(`Catat pembayaran ${rp(siap.total)} ke laporan keuangan?`)) return;
    aksi.mutate({ path: "/pembayaran-pemasok", body: { tanggal: tgl } });
  }

  return (
    <>
      <h1 className="text-lg font-bold">Pesanan ke tukang</h1>
      <Card>
        <div className="max-w-xs">
          <Field label="Tanggal pembayaran" hint="Diambil Senin–Sabtu minggu sebelum Selasa acuan ikut dibayar">
            <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
          </Field>
        </div>
      </Card>
      <ErrorBox error={siapQ.error ?? aksi.error} />
      {siapQ.isLoading && <Memuat />}
      {siap && (
        <>
          <p className="text-sm text-stone-600">
            Selasa acuan <b>{tanggal(siap.selasa)}</b> · diambil sampai <b>{tanggal(siap.batas_diambil)}</b> (Sabtu)
          </p>
          {siap.sudah_dicatat_id && (
            <p className="rounded-xl bg-hijau-muda px-3 py-2 text-sm text-hijau">
              Pembayaran Selasa ini sudah dicatat.{" "}
              <button className="font-semibold underline" onClick={() => setLihat(siap.sudah_dicatat_id)}>
                Lihat rincian
              </button>
            </p>
          )}
          {siap.pemasok.length === 0 && !siap.sudah_dicatat_id && <Kosong teks="Tidak ada pesanan yang siap dibayar." />}
          {siap.pemasok.map((g) => (
            <Card
              key={g.pemasok_id}
              judul={`${g.nama} · ${g.jenis === "supplier" ? "supplier" : "tukang kayu"}`}
              aksi={
                <span className="flex flex-wrap items-center gap-2">
                  <a className="text-xs font-semibold text-hijau hover:underline" href={apiUrl(`/po/${g.pemasok_id}/pdf${query({ tanggal: tgl })}`)} target="_blank" rel="noreferrer">
                    PDF PO
                  </a>
                  <BagikanWA jenis="po" id={g.pemasok_id} tanggal={tgl} label="Kirim PO" />
                </span>
              }
            >
              <Tabel minLebar={640}>
                <thead>
                  <tr>
                    <Th lengket>Tanggal selesai</Th>
                    <Th>Kode pesanan</Th>
                    <Th>Barang</Th>
                    <Th kanan>Qty</Th>
                    <Th kanan>Jumlah</Th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((i) => (
                    <tr key={i.order_id}>
                      <Td lengket className="whitespace-nowrap">
                        {tanggal(i.tgl_diambil)} {i.terlambat && <Lencana warna="oranye">terlambat</Lencana>}
                      </Td>
                      <Td>{i.no_order || "—"}</Td>
                      <Td>{produk.get(i.produk_id)?.nama ?? "—"} <span className="text-stone-500">{produk.get(i.produk_id)?.ukuran}</span></Td>
                      <Td kanan>{i.qty}</Td>
                      <Td kanan>{rp(i.jumlah)}</Td>
                    </tr>
                  ))}
                  <tr>
                    <TdTotal lengket colSpan={4}>Subtotal {g.nama}</TdTotal>
                    <TdTotal kanan>{rp(g.subtotal)}</TdTotal>
                  </tr>
                </tbody>
              </Tabel>
            </Card>
          ))}
          {siap.pemasok.length > 0 && !siap.sudah_dicatat_id && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base font-bold">Total dibayar Selasa: {rp(siap.total)}</p>
                <Button disabled={aksi.isPending} onClick={kirimKeLaporan}>
                  Kirim ke laporan
                </Button>
              </div>
              <p className="mt-1 text-xs text-stone-500">Dicatat 1 kali per Selasa sebagai 1 transaksi; rincian barang tersimpan di dalamnya.</p>
            </Card>
          )}
        </>
      )}

      <Card judul="Riwayat pembayaran">
        {!riwayatQ.data?.length ? (
          <Kosong teks="Belum ada pembayaran." />
        ) : (
          <Tabel minLebar={480}>
            <thead>
              <tr>
                <Th lengket>Selasa</Th>
                <Th>Tanggal catat</Th>
                <Th kanan>Total</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {riwayatQ.data.map((p) => (
                <tr key={p.id}>
                  <Td lengket>{tanggal(p.selasa)}</Td>
                  <Td>{tanggal(p.tanggal)}</Td>
                  <Td kanan>{rp(p.total)}</Td>
                  <Td>{p.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <Lencana warna="hijau">tercatat</Lencana>}</Td>
                  <Td className="whitespace-nowrap">
                    <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => setLihat(p.id)}>
                      Rincian
                    </button>
                    {!p.dibatalkan && (
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          const alasan = window.prompt("Alasan membatalkan pembayaran ini?");
                          if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/pembayaran-pemasok/${p.id}/batal`, body: { alasan: alasan.trim() } });
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
      {lihat && <Rincian id={lihat} onTutup={() => setLihat(null)} />}
    </>
  );
}
