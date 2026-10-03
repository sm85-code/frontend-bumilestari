import { useState } from "react";
import { Button, Card, Dialog, ErrorBox, Field, Input, Kosong, Lencana, Memuat, Select, Tabel, Td, Th } from "../../components/ui";
import { useAksi, usePemasok } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pemasok } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Pemasok; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({
    nama: awal?.nama ?? "", jenis: awal?.jenis ?? "tukang_kayu", kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "",
    nama_bank: awal?.nama_bank ?? "", no_rekening: awal?.no_rekening ?? "", atas_nama: awal?.atas_nama ?? "", kontak: awal?.kontak ?? "",
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pemasok/${awal.id}`, method: "PATCH", body } : { path: "/pemasok", body }, { onSuccess: onSelesai });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nama">
          <Input required {...bind("nama")} />
        </Field>
        <Field label="Jenis">
          <Select disabled={!!awal} {...bind("jenis")}>
            <option value="tukang_kayu">Tukang kayu</option>
            <option value="supplier">Supplier (non kayu)</option>
          </Select>
        </Field>
        <Field label="Kode PO" hint="Kosong = otomatis berurutan. Tampil di nomor PO, mis. 005">
          <Input {...bind("kode")} />
        </Field>
        <Field label="Nomor WhatsApp" hint="mis. 0812xxxx; untuk tombol Kirim PO">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
        <Field label="Bank">
          <Input {...bind("nama_bank")} />
        </Field>
        <Field label="Nomor rekening">
          <Input inputMode="numeric" {...bind("no_rekening")} />
        </Field>
        <Field label="Atas nama">
          <Input {...bind("atas_nama")} />
        </Field>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
      </div>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterPemasok() {
  const q = usePemasok();
  const aksi = useAksi();
  const [form, setForm] = useState<Pemasok | "baru" | null>(null);
  return (
    <Card judul="Tukang kayu dan supplier" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setForm("baru")}>+ Tukang/supplier</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? (
        <Memuat />
      ) : !q.data?.length ? (
        <Kosong teks="Belum ada data." />
      ) : (
        <Tabel minLebar={780}>
          <thead>
            <tr>
              <Th lengket>Nama</Th>
              <Th>Jenis</Th>
              <Th>Kode PO</Th>
              <Th>WhatsApp</Th>
              <Th>Rekening</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((p) => (
              <tr key={p.id}>
                <Td lengket>{p.nama}</Td>
                <Td>{p.jenis === "tukang_kayu" ? <Lencana warna="hijau">tukang kayu</Lencana> : <Lencana>supplier</Lencana>}</Td>
                <Td>{p.kode || "—"}</Td>
                <Td>{p.no_wa || <span className="text-oranye">belum diisi</span>}</Td>
                <Td>{p.no_rekening ? `${p.nama_bank} ${p.no_rekening}` : "—"}</Td>
                <Td className="whitespace-nowrap">
                  <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => setForm(p)}>Ubah</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => window.confirm(`Nonaktifkan ${p.nama}?`) && aksi.mutate({ path: `/pemasok/${p.id}`, method: "PATCH", body: { aktif: false } })}>Nonaktifkan</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}
      {form && (
        <Dialog judul={form === "baru" ? "Tukang/supplier baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
