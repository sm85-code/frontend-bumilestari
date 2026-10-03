import { Card, Flex, Typography } from "antd";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { AksiForm, Button, Field, Formulir, Input } from "../components/ui";

export default function Masuk() {
  const { user, masuk } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [proses, setProses] = useState(false);

  if (user) return <Navigate to={isPemilik(user.role) ? "/" : "/kas-kecil"} replace />;

  async function kirim() {
    setProses(true);
    setError(null);
    try {
      await masuk(email.trim(), password);
    } catch (err) {
      setError(err);
    } finally {
      setProses(false);
    }
  }

  return (
    <Flex vertical align="center" justify="center" gap="large" style={{ minHeight: "100%", padding: 24 }}>
      <Flex vertical align="center">
        <img src="/logo.png" alt="Bumi Lestari" width={128} height={128} />
        <Typography.Title level={3} type="success" style={{ margin: 0 }}>
          Masuk
        </Typography.Title>
        <Typography.Text type="secondary">Keuangan dan order Bumi Lestari</Typography.Text>
      </Flex>
      <Card style={{ width: "100%", maxWidth: 380 }}>
        <Formulir onKirim={kirim}>
          <Field label="Email">
            <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Kata sandi">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <AksiForm error={error}>
            <Button type="submit" disabled={proses} penuh>
              {proses ? "Masuk…" : "Masuk"}
            </Button>
          </AksiForm>
        </Formulir>
      </Card>
    </Flex>
  );
}
