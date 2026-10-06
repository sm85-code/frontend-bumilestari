import { labelPeran } from "../lib/format";
import { useState } from "react";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { PanduanStaf, usePanduanStaf } from "../components/PanduanStaf";
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
  const staf = Boolean(user) && !isPemilik(user?.role);
  const panduan = usePanduanStaf(user?.id, false);

  async function ganti() {
    setError(null);
    setSukses(false);
    if (baru !== ulang) {
      setError(new Error("Kata sandi baru dan ulangannya tidak sama"));
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
      <PageHeader judul="Profil saya" />
      <div style={{ display: "grid", gap: 20, maxWidth: 640, width: "100%" }}>
        {user?.must_change_password && (
          <Alert
            type="warning"
            showIcon
            title="Demi keamanan, ganti kata sandi bawaan Anda dulu sebelum memakai aplikasi."
          />
        )}
        <Card judul="Data saya">
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="Nama">{user?.nama}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Peran">{labelPeran(user?.role)}</Descriptions.Item>
          </Descriptions>
        </Card>
        <Card judul="Ganti kata sandi">
          <Formulir onKirim={ganti}>
            <Field label="Kata sandi saat ini">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={lama}
                onChange={(e) => setLama(e.target.value)}
              />
            </Field>
            <Field label="Kata sandi baru" hint="Minimal 8 karakter">
              <Input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={baru}
                onChange={(e) => setBaru(e.target.value)}
              />
            </Field>
            <Field label="Ulangi kata sandi baru">
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
                  title="Kata sandi berhasil diganti."
                />
              )}
              <Button type="submit" disabled={proses} penuh>
                Simpan kata sandi
              </Button>
            </AksiForm>
          </Formulir>
        </Card>
        {staf && (
          <Card judul="Panduan">
            <Button variant="pinggir" onClick={panduan.tampilkan}>
              Buka panduan kas kecil
            </Button>
          </Card>
        )}
        <Button variant="pinggir" penuh onClick={() => { void keluar().catch(setError); }}>
          Keluar
        </Button>
      </div>
      <PanduanStaf buka={panduan.buka} onTutup={panduan.tutup} />
    </>
  );
}
