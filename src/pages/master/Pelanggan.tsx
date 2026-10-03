import { useState } from "react";
import { Button, Card, Dialog, ErrorBox, Field, Input, Kosong, Memuat, Tabel, Td, Teks, Th } from "../../components/ui";
import { useAksi, usePelanggan } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Pelanggan } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: Pelanggan; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", kode: awal?.kode ?? "", no_wa: awal?.no_wa ?? "", kontak: awal?.kontak ?? "", alamat: awal?.alamat ?? "", catatan: awal?.catatan ?? "" });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = { ...f, nama: f.nama.trim() };
        aksi.mutate(awal ? { path: `/pelanggan/${awal.id}`, method: "PATCH", body } : { path: "/pelanggan", body }, { onSuccess: onSelesai });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nama penjual">
          <Input required {...bind("nama")} />
        </Field>
        <Field label="Kode invoice" hint="Kosong = otomatis berurutan. Tampil di nomor invoice, mis. 002">
          <Input {...bind("kode")} />
        </Field>
        <Field label="Nomor WhatsApp" hint="Untuk tombol Kirim invoice">
          <Input inputMode="tel" {...bind("no_wa")} />
        </Field>
        <Field label="Kontak lain">
          <Input {...bind("kontak")} />
        </Field>
      </div>
      <Field label="Alamat" hint="Tercetak di invoice">
        <Teks {...bind("alamat")} />
      </Field>
      <Field label="Catatan">
        <Input {...bind("catatan")} />
      </Field>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterPelanggan() {
  const q = usePelanggan();
  const aksi = useAksi();
  const [form, setForm] = useState<Pelanggan | "baru" | null>(null);
  return (
    <Card judul="Penjual lain (pemesan)" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setForm("baru")}>+ Penjual</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? (
        <Memuat />
      ) : !q.data?.length ? (
        <Kosong teks="Belum ada penjual lain." />
      ) : (
        <Tabel minLebar={680}>
          <thead>
            <tr>
              <Th lengket>Nama</Th>
              <Th>Kode invoice</Th>
              <Th>WhatsApp</Th>
              <Th>Alamat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((p) => (
              <tr key={p.id}>
                <Td lengket>{p.nama}</Td>
                <Td>{p.kode || "—"}</Td>
                <Td>{p.no_wa || <span className="text-oranye">belum diisi</span>}</Td>
                <Td className="text-stone-600">{p.alamat || "—"}</Td>
                <Td className="whitespace-nowrap">
                  <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => setForm(p)}>Ubah</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => window.confirm(`Nonaktifkan ${p.nama}?`) && aksi.mutate({ path: `/pelanggan/${p.id}`, method: "PATCH", body: { aktif: false } })}>Nonaktifkan</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}
      {form && (
        <Dialog judul={form === "baru" ? "Penjual lain baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
