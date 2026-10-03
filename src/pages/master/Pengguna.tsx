import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Card, DataTabel, Dialog, ErrorBox, Field, Input, Lencana, Memuat, Select, TombolLink } from "../../components/ui";
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

  const kolom: TableColumnsType<User> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 150 },
    { title: "Email", dataIndex: "email", render: (v: string) => <span className="text-coklat">{v}</span> },
    { title: "Peran", dataIndex: "role", render: (v: string) => <Lencana warna={v === "admin" ? "oranye" : v === "owner" ? "hijau" : "abu"}>{v}</Lencana> },
    {
      title: "Status",
      render: (_, u) => (
        <span className="inline-flex flex-wrap gap-1">
          {u.aktif ? "aktif" : <Lencana warna="merah">nonaktif</Lencana>}
          {u.must_change_password && <Lencana warna="oranye">password sementara</Lencana>}
        </span>
      ),
    },
    {
      title: "Aksi",
      width: 230,
      render: (_, u) => (
        <span className="flex flex-wrap">
          <TombolLink onClick={() => setForm(u)}>Ubah</TombolLink>
          <TombolLink onClick={() => resetPassword(u)}>Reset password</TombolLink>
          {u.id !== user?.id && (
            <TombolLink bahaya onClick={() => aksi.mutate({ path: `/users/${u.id}`, method: "PATCH", body: { aktif: !u.aktif } })}>
              {u.aktif ? "Nonaktifkan" : "Aktifkan"}
            </TombolLink>
          )}
        </span>
      ),
    },
  ];

  return (
    <Card judul="Pengguna (admin)" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Pengguna</Button>}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada pengguna." />}
      {form && (
        <Dialog judul={form === "baru" ? "Pengguna baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <Form awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </Card>
  );
}
