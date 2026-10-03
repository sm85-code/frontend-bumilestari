import { useState } from "react";
import { Button, Card, Dialog, ErrorBox, Field, Input, Select, Tabel, Td, Th } from "../../components/ui";
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

  return (
    <>
      <Card judul="Akun kas" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setDialog("akun")}>+ Akun</Button>}>
        <ErrorBox error={akunQ.error} />
        <Tabel minLebar={420}>
          <thead>
            <tr>
              <Th lengket>Akun</Th>
              <Th>Kode</Th>
              <Th>Jenis</Th>
              <Th kanan>Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {(akunQ.data ?? []).map((x) => (
              <tr key={x.id}>
                <Td lengket>{x.nama}</Td>
                <Td className="text-stone-500">{x.kode}</Td>
                <Td>{JENIS_AKUN[x.jenis] ?? x.jenis}</Td>
                <Td kanan>{rp(x.saldo)}</Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      </Card>
      <Card judul="Kategori transaksi" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setDialog("kategori")}>+ Kategori</Button>}>
        <ErrorBox error={kategoriQ.error} />
        <Tabel minLebar={320}>
          <thead>
            <tr>
              <Th lengket>Kategori</Th>
              <Th>Jenis</Th>
            </tr>
          </thead>
          <tbody>
            {(kategoriQ.data ?? []).map((x) => (
              <tr key={x.id}>
                <Td lengket>{x.nama}</Td>
                <Td>{x.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}</Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      </Card>

      {dialog === "akun" && (
        <Dialog judul="Akun kas baru" onTutup={() => setDialog(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
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
            <ErrorBox error={aksi.error} />
            <Button type="submit" disabled={aksi.isPending} className="w-full">Simpan</Button>
          </form>
        </Dialog>
      )}
      {dialog === "kategori" && (
        <Dialog judul="Kategori baru" onTutup={() => setDialog(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
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
            <ErrorBox error={aksi.error} />
            <Button type="submit" disabled={aksi.isPending} className="w-full">Simpan</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
