import { Typography } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { AksiForm, Angka, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Select } from "../../components/ui";
import { isKategoriMarketplace, isKategoriSistem, KATEGORI_KAS_KECIL, labelKategori } from "../../lib/kategori";
import type { AkunKas, Kategori } from "../../lib/types";
import { useAkun, useAksi, useKategori } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, rp } from "../../lib/format";

const JENIS_AKUN: Record<string, string> = { kas: "Kas", bank: "Bank", ewallet: "E-wallet", kas_kecil: "Kas kecil", kas_iklan: "Kas iklan" };

export default function MasterAkunKategori() {
  const akunQ = useAkun();
  const kategoriQ = useKategori();
  const aksi = useAksi();
  const [dialog, setDialog] = useState<"akun" | "kategori" | null>(null);
  const a = useFields({ kode: "", nama: "", jenis: "ewallet", saldo_awal: "" });
  const k = useFields({ nama: "", jenis: "pengeluaran" });
  const kolomAkun: TableColumnsType<AkunKas> = [
    { title: "Akun kas", dataIndex: "nama", fixed: "left", width: 170 },
    { title: "Plafon", dataIndex: "plafon", align: "right", render: (v: string | null) => (v ? <Angka>{rp(v)}</Angka> : "—") },
    { title: "Kode", dataIndex: "kode", render: (v: string) => <Typography.Text type="secondary">{v}</Typography.Text> },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => JENIS_AKUN[v] ?? v },
    { title: "Saldo", dataIndex: "saldo", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
  ];
  const kolomKategori: TableColumnsType<Kategori> = [
    { title: "Kategori", dataIndex: "nama", render: (v: string) => (labelKategori(v) !== v ? <>{labelKategori(v)} <Typography.Text type="secondary">({v})</Typography.Text></> : v) },
    { title: "Jenis", dataIndex: "jenis", render: (v: string) => (v === "pemasukan" ? "Pemasukan" : "Pengeluaran") },
    {
      title: "Dipakai di",
      render: (_, k) =>
        isKategoriSistem(k) ? (
          <Lencana warna="oranye">sistem (otomatis)</Lencana>
        ) : isKategoriMarketplace(k) ? (
          <Lencana warna="oranye">impor file marketplace</Lencana>
        ) : KATEGORI_KAS_KECIL.some((n) => n.toLowerCase() === k.nama.trim().toLowerCase()) && k.jenis === "pengeluaran" ? (
          <Lencana warna="hijau">kas kecil & manual</Lencana>
        ) : (
          <Lencana>manual</Lencana>
        ),
    },
  ];

  return (
    <>
      <Card judul="Akun kas & plafon" aksi={<Button kecil onClick={() => setDialog("akun")}><PlusOutlined /> Akun kas</Button>}>
        <ErrorBox error={akunQ.error} />
        <DataTabel kolom={kolomAkun} data={akunQ.data ?? []} rowKey="id" minLebar={460} />
      </Card>
      <Card judul="Kategori transaksi" aksi={<Button kecil onClick={() => setDialog("kategori")}><PlusOutlined /> Kategori</Button>}>
        <ErrorBox error={kategoriQ.error} />
        <Typography.Paragraph type="secondary">
          Kategori <b>sistem</b> hanya dipakai transaksi otomatis (bayar tukang & supplier, penerimaan penjual lain, gaji, tagihan rutin, bagi hasil) dan tidak muncul di form manual. Staf hanya melihat Transport, Packing, Operasional, Lainnya.
        </Typography.Paragraph>
        <DataTabel kolom={kolomKategori} data={kategoriQ.data ?? []} rowKey="id" minLebar={420} />
      </Card>

      {dialog === "akun" && (
        <Dialog judul="Akun kas baru" onTutup={() => setDialog(null)}>
          <Formulir
      onKirim={() => {
              aksi.mutate({ path: "/akun-kas", body: { kode: a.f.kode.trim().toUpperCase(), nama: a.f.nama.trim(), jenis: a.f.jenis, saldo_awal: bersihkanAngka(a.f.saldo_awal) || "0" } }, { onSuccess: () => { a.reset(); setDialog(null); } });
            }}
          >
            <Field label="Kode" hint="mis. SALDO_TOKOPEDIA">
              <Input required {...a.bind("kode")} />
            </Field>
            <Field label="Nama">
              <Input required {...a.bind("nama")} />
            </Field>
            <Field label="Jenis" hint="Kas kecil dan kas iklan memakai plafon dan sudah tersedia">
              <Select {...a.bind("jenis")}>
                <option value="kas">Kas</option>
                <option value="bank">Bank</option>
                <option value="ewallet">E-wallet / saldo toko</option>
              </Select>
            </Field>
            <Field label="Saldo awal (Rp)">
              <Input inputMode="numeric" {...a.bind("saldo_awal")} />
            </Field>
            <AksiForm error={aksi.error}>
              <Button type="submit" disabled={aksi.isPending} penuh>Simpan</Button>
            </AksiForm>
          </Formulir>
        </Dialog>
      )}
      {dialog === "kategori" && (
        <Dialog judul="Kategori baru" onTutup={() => setDialog(null)}>
          <Formulir
      onKirim={() => {
              aksi.mutate({ path: "/kategori", body: { nama: k.f.nama.trim(), jenis: k.f.jenis } }, { onSuccess: () => { k.reset(); setDialog(null); } });
            }}
          >
            <Field label="Nama">
              <Input required {...k.bind("nama")} />
            </Field>
            <Field label="Jenis">
              <Select {...k.bind("jenis")}>
                <option value="pengeluaran">Pengeluaran</option>
                <option value="pemasukan">Pemasukan</option>
              </Select>
            </Field>
            <AksiForm error={aksi.error}>
              <Button type="submit" disabled={aksi.isPending} penuh>Simpan</Button>
            </AksiForm>
          </Formulir>
        </Dialog>
      )}
    </>
  );
}
