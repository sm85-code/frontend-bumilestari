import { useState } from "react";
import { Button, Card, Dialog, ErrorBox, Field, Input, Kosong, Lencana, Memuat, Select, Tabel, Td, Th } from "../../components/ui";
import { peta, useAkun, useAksi, useSaluran } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { Saluran } from "../../lib/types";

const JENIS = { marketplace: "Marketplace", web: "Toko web sendiri", reseller: "Penjual lain (reseller)" } as const;

function Form({ awal, onSelesai }: { awal?: Saluran; onSelesai: () => void }) {
  const aksi = useAksi();
  const akunQ = useAkun();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", jenis: awal?.jenis ?? "marketplace", akun_id: awal?.akun_id ?? "" });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = { nama: f.nama.trim(), akun_id: f.akun_id || null };
        aksi.mutate(awal ? { path: `/saluran/${awal.id}`, method: "PATCH", body } : { path: "/saluran", body: { ...body, jenis: f.jenis } }, { onSuccess: onSelesai });
      }}
    >
      <Field label="Nama saluran" hint="mis. Shopee, Tokopedia, Toko web">
        <Input required {...bind("nama")} />
      </Field>
      <Field label="Jenis">
        <Select disabled={!!awal} {...bind("jenis")}>
          {Object.entries(JENIS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Akun tujuan dana" hint="Saldo toko tempat uang saluran ini masuk">
        <Select {...bind("akun_id")}>
          <option value="">—</option>
          {(akunQ.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.nama}
            </option>
          ))}
        </Select>
      </Field>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterSaluran() {
  const q = useSaluran();
  const akun = peta(useAkun().data);
  const aksi = useAksi();
  const [form, setForm] = useState<Saluran | "baru" | null>(null);
  return (
    <Card judul="Saluran penjualan" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setForm("baru")}>+ Saluran</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? (
        <Memuat />
      ) : !q.data?.length ? (
        <Kosong teks="Belum ada saluran." />
      ) : (
        <Tabel minLebar={520}>
          <thead>
            <tr>
              <Th lengket>Nama</Th>
              <Th>Jenis</Th>
              <Th>Akun tujuan</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((s) => (
              <tr key={s.id}>
                <Td lengket>{s.nama}</Td>
                <Td><Lencana>{JENIS[s.jenis]}</Lencana></Td>
                <Td>{s.akun_id ? akun.get(s.akun_id)?.nama : "—"}</Td>
                <Td className="whitespace-nowrap">
                  <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => setForm(s)}>Ubah</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => window.confirm(`Nonaktifkan ${s.nama}?`) && aksi.mutate({ path: `/saluran/${s.id}`, method: "PATCH", body: { aktif: false } })}>Nonaktifkan</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}
      {form && (
        <Dialog judul={form === "baru" ? "Saluran baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
