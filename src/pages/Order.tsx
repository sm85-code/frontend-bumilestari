import { useQuery } from "@tanstack/react-query";
import { kolomTabelTambahan, useDefinisiKolom } from "../lib/kolom";
import { useState } from "react";
import FormOrder from "../components/FormOrder";
import FormReturOrder from "../components/FormReturOrder";
import FormUbahOrder from "../components/FormUbahOrder";
import { PlusOutlined } from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Angka, Button, Card, DataTabel, Dialog, ErrorBox, Field, Lencana, Memuat, PageHeader, Select, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { peta, useAksi, usePelanggan, usePemasok, useProduk, useSaluran } from "../lib/data";
import { rp, tanggal } from "../lib/format";
import { LABEL_STATUS, bolehRetur, salurCair, statusBerikut } from "../lib/order";
import type { Order, StatusOrder } from "../lib/types";

const WARNA: Record<StatusOrder, "hijau" | "oranye" | "merah" | "abu"> = {
  dipesan: "abu", dikerjakan: "oranye", diambil: "oranye", diterima: "oranye", dicat: "oranye", dikirim: "hijau", selesai: "hijau", batal: "merah", retur: "merah",
};

export default function OrderPage() {
  const [status, setStatus] = useState("");
  const [jenis, setJenis] = useState("");
  const [tambah, setTambah] = useState(false);
  const [ubah, setUbah] = useState<Order | null>(null);
  const [retur, setRetur] = useState<Order | null>(null);
  const q = useQuery({
    queryKey: ["order", status, jenis],
    queryFn: () => api<Order[]>(`/order${query({ status_order: status, jenis_produk: jenis })}`),
  });
  const produkQ = useProduk();
  const pemasokQ = usePemasok();
  const saluranQ = useSaluran();
  const pelangganQ = usePelanggan();
  const aksi = useAksi();
  const { konfirmasi, message } = useDialog();
  const produk = peta(produkQ.data);
  const pemasok = peta(pemasokQ.data);
  const saluran = peta(saluranQ.data);
  const pelanggan = peta(pelangganQ.data);

  function majukan(o: Order, berikut: StatusOrder) {
    if (!o.pemasok_id && (berikut === "dikerjakan" || berikut === "diterima")) {
      message.warning("Pilih tukang/supplier dulu sebelum order dikerjakan.");
      setUbah(o);
      return;
    }
    aksi.mutate({ path: `/order/${o.id}/status`, body: { status: berikut } });
  }

  const redup = (t: React.ReactNode) => (
    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
      {t}
    </Typography.Text>
  );
  const ktKolom = kolomTabelTambahan<Order>(useDefinisiKolom("order").data);
  const kolom: TableColumnsType<Order> = [
    {
      title: "Tanggal / kode",
      fixed: "left",
      width: 135,
      render: (_, o) => (
        <>
          <Angka>{tanggal(o.tanggal_order)}</Angka>
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
            <Typography.Text strong>{p?.nama ?? "—"}</Typography.Text> <Typography.Text type="secondary">{p?.ukuran}</Typography.Text>
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
    {
      title: "Tukang & supplier",
      width: 130,
      render: (_, o) =>
        o.pemasok_id ? (
          pemasok.get(o.pemasok_id)?.nama
        ) : o.status === "selesai" || o.status === "batal" || o.status === "retur" ? (
          "—"
        ) : (
          <TombolLink onClick={() => setUbah(o)}>Pilih tukang</TombolLink>
        ),
    },
    {
      title: "Total",
      align: "right",
      width: 165,
      render: (_, o) =>
        Number(o.total_penjualan) === 0 && salurCair(saluran.get(o.saluran_id)) ? (
          <>
            <Typography.Text type="secondary">Mengikuti file penghasilan</Typography.Text>
            {redup(`harga beli ${rp(o.biaya_pokok)}`)}
          </>
        ) : (
          <>
            <Typography.Text strong><Angka>{rp(o.total_penjualan)}</Angka></Typography.Text>
            {redup(`harga beli ${rp(o.biaya_pokok)} · margin ${rp(o.laba_kotor)}${Number(o.biaya_proses) ? ` · +proses ${rp(o.biaya_proses)}` : ""}`)}
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
            {o.dibayar_tukang && <Lencana warna="hijau">tukang dibayar</Lencana>}
            {o.dibayar_penjual_lain && <Lencana warna="hijau">dibayar penjual lain</Lencana>}
            {salurCair(saluran.get(o.saluran_id)) && (o.status === "dikirim" || o.status === "selesai") &&
              (o.status_cair === "cair" ? (
                <Lencana warna="hijau">cair{o.tgl_cair ? ` ${tanggal(o.tgl_cair)}` : ""}</Lencana>
              ) : (
                <Lencana warna="oranye">belum cair</Lencana>
              ))}
            {o.status === "retur" && redup(`Retur ${o.tgl_retur ? tanggal(o.tgl_retur) : ""}: ${o.alasan_retur ?? ""}${o.kembali_stok ? " · kembali ke stok" : ""}`)}
            {berikut && (
              <div>
                <TombolLink disabled={aksi.isPending} onClick={() => majukan(o, berikut)}>
                  → {LABEL_STATUS[berikut]}
                </TombolLink>
                <TombolLink onClick={() => setUbah(o)}>Ubah</TombolLink>
                {!o.terkunci && (
                  <TombolLink bahaya onClick={() => void konfirmasi("Batalkan order ini?", { ok: "Batalkan order", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/order/${o.id}/status`, body: { status: "batal" } }))}>
                    Batalkan
                  </TombolLink>
                )}
              </div>
            )}
            {bolehRetur(o, saluran.get(o.saluran_id)) && (
              <div>
                <TombolLink bahaya onClick={() => setRetur(o)}>
                  Retur
                </TombolLink>
              </div>
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
        <Row gutter={16}>
          <Col xs={12} md={6}>
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
          </Col>
          <Col xs={12} md={6}>
          <Field label="Jenis produk">
            <Select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="">Semua</option>
              <option value="kayu">Kayu</option>
              <option value="non_kayu">Non kayu</option>
            </Select>
          </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={[...kolom.slice(0, -1), ...ktKolom, ...kolom.slice(-1)]} data={q.data ?? []} rowKey="id" minLebar={940 + ktKolom.length * 120} kosong="Belum ada order." />}
      {ubah && (
        <Dialog judul={`Ubah order ${ubah.no_order || ""}`.trim()} onTutup={() => setUbah(null)}>
          <FormUbahOrder order={ubah} produk={produk.get(ubah.produk_id)} onSelesai={() => setUbah(null)} />
        </Dialog>
      )}
      {retur && (
        <Dialog judul={`Retur order ${retur.no_order || ""}`.trim()} onTutup={() => setRetur(null)}>
          <FormReturOrder order={retur} onSelesai={() => setRetur(null)} />
        </Dialog>
      )}
      {tambah && (
        <Dialog judul="Order baru" onTutup={() => setTambah(false)}>
          <FormOrder onSelesai={() => setTambah(false)} />
        </Dialog>
      )}
    </>
  );
}
