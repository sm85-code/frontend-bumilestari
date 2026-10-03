import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, ErrorBox, Field, Input } from "../components/ui";
import { api } from "../lib/api";
import type { User } from "../lib/types";

export default function Akun() {
  const { user, perbarui, keluar } = useAuth();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [sukses, setSukses] = useState(false);
  const [proses, setProses] = useState(false);

  async function ganti(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSukses(false);
    if (baru !== ulang) {
      setError(new Error("Password baru dan ulangannya tidak sama"));
      return;
    }
    setProses(true);
    try {
      perbarui(await api<User>("/auth/change-password", { body: { current_password: lama, new_password: baru } }));
      setSukses(true);
      setLama("");
      setBaru("");
      setUlang("");
    } catch (err) {
      setError(err);
    } finally {
      setProses(false);
    }
  }

  return (
    <>
      {user?.must_change_password && (
        <p className="rounded-xl bg-oranye-muda px-3 py-2 text-sm text-coklat">
          Demi keamanan, ganti password bawaan Anda dulu sebelum memakai aplikasi.
        </p>
      )}
      <Card judul="Akun saya">
        <p className="font-semibold">{user?.nama}</p>
        <p className="text-sm text-coklat">{user?.email}</p>
        <p className="text-sm text-coklat">Peran: {user?.role}</p>
      </Card>
      <Card judul="Ganti password">
        <form onSubmit={ganti} className="space-y-3">
          <Field label="Password saat ini">
            <Input type="password" autoComplete="current-password" required value={lama} onChange={(e) => setLama(e.target.value)} />
          </Field>
          <Field label="Password baru" hint="Minimal 8 karakter">
            <Input type="password" autoComplete="new-password" required minLength={8} value={baru} onChange={(e) => setBaru(e.target.value)} />
          </Field>
          <Field label="Ulangi password baru">
            <Input type="password" autoComplete="new-password" required value={ulang} onChange={(e) => setUlang(e.target.value)} />
          </Field>
          <ErrorBox error={error} />
          {sukses && <p className="rounded-xl bg-hijau-muda px-3 py-2 text-sm text-hijau">Password berhasil diganti.</p>}
          <Button type="submit" disabled={proses} className="w-full">
            Simpan password
          </Button>
        </form>
      </Card>
      <Button variant="pinggir" className="w-full" onClick={() => void keluar()}>
        Keluar
      </Button>
    </>
  );
}
