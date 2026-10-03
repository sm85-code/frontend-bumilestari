import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Alert, Descriptions } from "antd";
import {
  AksiForm,
  Button,
  Card,
  Field,
  Formulir,
  Input,
  PageHeader,
} from "../components/ui";
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

  async function ganti() {
    setError(null);
    setSukses(false);
    if (baru !== ulang) {
      setError(new Error("Password baru dan ulangannya tidak sama"));
      return;
    }
    setProses(true);
    try {
      perbarui(
        await api<User>("/auth/change-password", {
          body: { current_password: lama, new_password: baru },
        }),
      );
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
      <PageHeader judul="Akun" />
      <div style={{ display: "grid", gap: 20, maxWidth: 640, width: "100%" }}>
        {user?.must_change_password && (
          <Alert
            type="warning"
            showIcon
            title="Demi keamanan, ganti password bawaan Anda dulu sebelum memakai aplikasi."
          />
        )}
        <Card judul="Akun saya">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Nama">{user?.nama}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Peran">{user?.role}</Descriptions.Item>
          </Descriptions>
        </Card>
        <Card judul="Ganti password">
          <Formulir onKirim={ganti}>
            <Field label="Password saat ini">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={lama}
                onChange={(e) => setLama(e.target.value)}
              />
            </Field>
            <Field label="Password baru" hint="Minimal 8 karakter">
              <Input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={baru}
                onChange={(e) => setBaru(e.target.value)}
              />
            </Field>
            <Field label="Ulangi password baru">
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={ulang}
                onChange={(e) => setUlang(e.target.value)}
              />
            </Field>
            <AksiForm error={error}>
              {sukses && (
                <Alert
                  type="success"
                  showIcon
                  title="Password berhasil diganti."
                />
              )}
              <Button type="submit" disabled={proses} penuh>
                Simpan password
              </Button>
            </AksiForm>
          </Formulir>
        </Card>
        <Button variant="pinggir" penuh onClick={() => void keluar()}>
          Keluar
        </Button>
      </div>
    </>
  );
}
