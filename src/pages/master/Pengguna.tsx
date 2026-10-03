import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, Dialog, ErrorBox, Field, Input, Lencana, Memuat, Select, Tabel, Td, Th } from "../../components/ui";
import { api } from "../../lib/api";
import { useAksi } from "../../lib/data";
import { useFields } from "../../lib/form";
import type { User } from "../../lib/types";

function Form({ awal, onSelesai }: { awal?: User; onSelesai: () => void }) {
  const aksi = useAksi();
  const { user } = useAuth();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", email: awal?.email ?? "", role: awal?.role ?? "staff", password: "" });
  const diriSendiri = awal?.id === user?.id;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const body = awal ? { nama: f.nama.trim(), email: f.email.trim(), ...(diriSendiri ? {} : { role: f.role }) } : { nama: f.nama.trim(), email: f.email.trim(), role: f.role, password: f.password };
        aksi.mutate(awal ? { path: `/users/${awal.id}`, method: "PATCH", body } : { path: "/users", body }, { onSuccess: onSelesai });
      }}
    >
      <Field label="Nama">
        <Input required {...bind("nama")} />
      </Field>
      <Field label="Email (untuk login)">
        <Input type="email" required {...bind("email")} />
      </Field>
      <Field label="Peran" hint={diriSendiri ? "Peran akun sendiri tidak bisa diubah" : "Admin di atas owner; staf hanya mengurus kas kecil"}>
        <Select disabled={diriSendiri} {...bind("role")}>
          <option value="staff">Staf (kas kecil)</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>
      {!awal && (
        <Field label="Password sementara" hint="Minimal 8 karakter; pengguna wajib menggantinya saat masuk">
          <Input type="password" required minLength={8} autoComplete="new-password" {...bind("password")} />
        </Field>
      )}
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterPengguna() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["users"], queryFn: () => api<User[]>("/users") });
  const aksi = useAksi();
  const [form, setForm] = useState<User | "baru" | null>(null);

  function resetPassword(u: User) {
    const baru = window.prompt(`Password baru untuk ${u.nama} (minimal 8 karakter)?\nPengguna wajib menggantinya saat masuk.`);
    if (baru && baru.length >= 8) aksi.mutate({ path: `/users/${u.id}/reset-password`, body: { new_password: baru } });
    else if (baru) window.alert("Password minimal 8 karakter.");
  }

  return (
    <Card judul="Pengguna (admin)" aksi={<Button className="!min-h-9 !px-3 !text-xs" onClick={() => setForm("baru")}>+ Pengguna</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? (
        <Memuat />
      ) : (
        <Tabel minLebar={640}>
          <thead>
            <tr>
              <Th lengket>Nama</Th>
              <Th>Email</Th>
              <Th>Peran</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((u) => (
              <tr key={u.id}>
                <Td lengket>{u.nama}</Td>
                <Td className="text-stone-600">{u.email}</Td>
                <Td><Lencana warna={u.role === "admin" ? "oranye" : u.role === "owner" ? "hijau" : "abu"}>{u.role}</Lencana></Td>
                <Td>{u.aktif ? "aktif" : <Lencana warna="merah">nonaktif</Lencana>}{u.must_change_password && <Lencana warna="oranye">password sementara</Lencana>}</Td>
                <Td className="whitespace-nowrap">
                  <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => setForm(u)}>Ubah</button>
                  <button className="mr-3 text-xs font-semibold text-hijau hover:underline" onClick={() => resetPassword(u)}>Reset password</button>
                  {u.id !== user?.id && (
                    <button className="text-xs text-red-600 hover:underline" onClick={() => aksi.mutate({ path: `/users/${u.id}`, method: "PATCH", body: { aktif: !u.aktif } })}>
                      {u.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabel>
      )}
      {form && (
        <Dialog judul={form === "baru" ? "Pengguna baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
