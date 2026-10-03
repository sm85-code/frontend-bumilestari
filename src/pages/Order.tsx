import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import FormOrder from "../components/FormOrder";
import { Button, Card, Dialog, ErrorBox, Field, Kosong, Lencana, Memuat, Select, Tabel, Td, Th } from "../components/ui";
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

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Order</h1>
        <Button onClick={() => setTambah(true)}>+ Order baru</Button>
      </div>
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
      {q.isLoading ? (
        <Memuat />
      ) : !q.data?.length ? (
        <Kosong teks="Belum ada order." />
      ) : (
        <Tabel minLebar={880}>
          <thead>
            <tr>
              <Th lengket>Tanggal</Th>
              <Th>Kode pesanan</Th>
              <Th>Barang</Th>
              <Th>Saluran / pembeli</Th>
              <Th>Pemasok</Th>
              <Th kanan>Total</Th>
              <Th kanan>Laba</Th>
              <Th>Status dan aksi</Th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((o) => {
              const p = produk.get(o.produk_id);
              const berikut = statusBerikut(o, p?.jenis_produk ?? "kayu");
              return (
                <tr key={o.id}>
                  <Td lengket className="whitespace-nowrap">{tanggal(o.tanggal_order)}</Td>
                  <Td className="whitespace-nowrap">{o.no_order || "—"}</Td>
                  <Td>
                    {p?.nama ?? "—"} <span className="text-stone-500">{p?.ukuran}</span>
                    {o.warna && <span className="block text-xs text-stone-500">Warna: {o.warna}</span>}
                    {!o.butuh_cat && p?.jenis_produk === "kayu" && <Lencana>polos</Lencana>}
                  </Td>
                  <Td>
                    {saluran.get(o.saluran_id)?.nama}
                    <span className="block text-xs text-stone-500">{o.pelanggan_id ? pelanggan.get(o.pelanggan_id)?.nama : o.nama_pembeli}</span>
                  </Td>
                  <Td>{o.pemasok_id ? pemasok.get(o.pemasok_id)?.nama : <span className="text-oranye">belum dipilih</span>}</Td>
                  <Td kanan>
                    {rp(o.total_penjualan)}
                    <span className="block text-xs text-stone-500">biaya {rp(o.biaya_pokok)}</span>
                  </Td>
                  <Td kanan>{rp(o.laba_kotor)}</Td>
                  <Td>
                    <Lencana warna={WARNA[o.status]}>{LABEL_STATUS[o.status]}</Lencana>
                    {berikut && (
                      <span className="mt-1 flex flex-wrap gap-x-3">
                        <button className="text-xs font-semibold text-hijau hover:underline" disabled={aksi.isPending} onClick={() => majukan(o, berikut)}>
                          → {LABEL_STATUS[berikut]}
                        </button>
                        <button className="text-xs text-red-600 hover:underline" onClick={() => window.confirm("Batalkan order ini?") && aksi.mutate({ path: `/order/${o.id}/status`, body: { status: "batal" } })}>
                          Batalkan
                        </button>
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabel>
      )}
      {tambah && (
        <Dialog judul="Order baru" onTutup={() => setTambah(false)}>
          <FormOrder onSelesai={() => setTambah(false)} />
        </Dialog>
      )}
    </>
  );
}
