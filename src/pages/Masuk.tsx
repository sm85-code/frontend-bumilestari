import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Button, ErrorBox, Field, Input } from "../components/ui";
import Wallpaper from "../components/Wallpaper";

export default function Masuk() {
  const { user, masuk } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [proses, setProses] = useState(false);

  if (user) return <Navigate to={isPemilik(user.role) ? "/" : "/kas-kecil"} replace />;

  async function kirim(e: FormEvent) {
    e.preventDefault();
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
    <div className="relative min-h-full">
      <Wallpaper />
      <div className="relative z-10 mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <img src="/logo.png" alt="Bumi Lestari" className="mx-auto h-32 w-32" />
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-hijau">Masuk</h1>
        <p className="text-sm text-coklat">Keuangan dan order Bumi Lestari</p>
      </div>
      <form onSubmit={kirim} className="space-y-4 rounded-2xl border border-garis bg-white p-5 shadow-soft">
        <Field label="Email">
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorBox error={error} />
        <Button type="submit" disabled={proses} className="w-full">
          {proses ? "Masuk…" : "Masuk"}
        </Button>
      </form>
      </div>
    </div>
  );
}
