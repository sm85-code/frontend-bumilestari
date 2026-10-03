import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorBox, Field, Input, Memuat, Teks } from "../../components/ui";
import { api } from "../../lib/api";
import { useAksi } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num } from "../../lib/format";
import type { Profil } from "../../lib/types";

function FormProfil({ p, bolehUbah }: { p: Profil; bolehUbah: boolean }) {
  const aksi = useAksi();
  const { f, bind } = useFields({
    nama_usaha: p.nama_usaha, alamat: p.alamat, telepon: p.telepon, email: p.email, catatan: p.catatan,
    biaya_proses_order: String(Math.round(num(p.biaya_proses_order))), info_pembayaran: p.info_pembayaran,
    nama_usaha_lama: p.nama_usaha_lama, nama_usaha_berlaku_mulai: p.nama_usaha_berlaku_mulai ?? "",
  });
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setOk(false);
        aksi.mutate(
          { path: "/profil", method: "PUT", body: { ...f, nama_usaha: f.nama_usaha.trim(), biaya_proses_order: bersihkanAngka(f.biaya_proses_order) || "0", nama_usaha_berlaku_mulai: f.nama_usaha_berlaku_mulai || null } },
          { onSuccess: () => setOk(true) },
        );
      }}
    >
      <fieldset disabled={!bolehUbah} className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nama usaha (tercetak di PO dan invoice)">
            <Input required {...bind("nama_usaha")} />
          </Field>
          <Field label="Telepon">
            <Input {...bind("telepon")} />
          </Field>
          <Field label="Nama usaha sebelumnya" hint="Dokumen bertanggal sebelum tanggal peralihan memakai nama ini">
            <Input {...bind("nama_usaha_lama")} />
          </Field>
          <Field label="Nama baru berlaku mulai">
            <Input type="date" {...bind("nama_usaha_berlaku_mulai")} />
          </Field>
          <Field label="Email">
            <Input type="email" {...bind("email")} />
          </Field>
          <Field label="Biaya proses pesanan (Rp per order)" hint="Flat untuk order penjual lain; disalin ke order saat dibuat">
            <Input inputMode="numeric" {...bind("biaya_proses_order")} />
          </Field>
        </div>
        <Field label="Alamat usaha">
          <Teks {...bind("alamat")} />
        </Field>
        <Field label="Tujuan pembayaran (tercetak di invoice)" hint="mis. QRIS Pangeran Homeware atau nomor rekening">
          <Input {...bind("info_pembayaran")} />
        </Field>
        <Field label="Catatan">
          <Input {...bind("catatan")} />
        </Field>
      </fieldset>
      <ErrorBox error={aksi.error} />
      {ok && <p className="rounded-xl bg-hijau-muda px-3 py-2 text-sm text-hijau">Profil disimpan.</p>}
      {bolehUbah ? (
        <Button type="submit" disabled={aksi.isPending}>Simpan profil</Button>
      ) : (
        <p className="text-xs text-stone-500">Hanya admin yang boleh mengubah profil.</p>
      )}
    </form>
  );
}

function FormProporsi({ p, bolehUbah }: { p: Profil; bolehUbah: boolean }) {
  const aksi = useAksi();
  const awal = (k: "admin" | "owner") => String(num(p.proporsi_bagi_hasil.find((x) => x.penerima === k)?.persen));
  const { f, bind } = useFields({ admin: awal("admin"), owner: awal("owner") });
  const total = num(f.admin) + num(f.owner);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        aksi.mutate({ path: "/profil/proporsi-bagi-hasil", method: "PUT", body: { persen_admin: f.admin, persen_owner: f.owner } });
      }}
    >
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Field label="Admin (%)">
          <Input inputMode="decimal" disabled={!bolehUbah} {...bind("admin")} />
        </Field>
        <Field label="Owner (%)">
          <Input inputMode="decimal" disabled={!bolehUbah} {...bind("owner")} />
        </Field>
      </div>
      <p className={`text-sm ${total === 100 ? "text-hijau" : "text-red-600"}`}>Total {total}% {total === 100 ? "" : "(harus 100%)"}</p>
      <ErrorBox error={aksi.error} />
      {bolehUbah && (
        <Button type="submit" disabled={aksi.isPending || total !== 100}>
          Simpan proporsi
        </Button>
      )}
    </form>
  );
}

export default function MasterProfil() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["profil"], queryFn: () => api<Profil>("/profil") });
  const bolehUbah = user?.role === "admin";
  if (q.isLoading) return <Memuat />;
  if (!q.data) return <ErrorBox error={q.error} />;
  return (
    <>
      <Card judul="Profil UMKM">
        <FormProfil key={JSON.stringify(q.data)} p={q.data} bolehUbah={bolehUbah} />
      </Card>
      <Card judul="Proporsi bagi hasil dari laba bersih">
        <FormProporsi key={JSON.stringify(q.data.proporsi_bagi_hasil)} p={q.data} bolehUbah={bolehUbah} />
      </Card>
    </>
  );
}
