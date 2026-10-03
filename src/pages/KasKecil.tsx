import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import { Card, ErrorBox, Memuat, PageHeader, Progress } from "../components/ui";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { api, query } from "../lib/api";
import { num, rp } from "../lib/format";
import type { AkunKas, Kategori, Transaksi } from "../lib/types";

export default function KasKecil() {
  const { user } = useAuth();
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const kas = akunQ.data?.find((a) => a.jenis === "kas_kecil");
  const trxQ = useQuery({
    queryKey: ["transaksi", kas?.id],
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: kas?.id })}`),
    enabled: !!kas,
  });

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  if (!kas) return <ErrorBox error={new Error("Akun kas kecil belum tersedia. Minta admin menjalankan seed-now.")} />;

  const saldo = num(kas.saldo);
  const plafon = num(kas.plafon);
  return (
    <>
    <PageHeader judul="Kas kecil" sub="Pegangan staf, diisi kembali ke jatah tiap Selasa" />
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr] lg:items-start">
      <div className="space-y-4">
        <Card judul="Kas kecil">
          <p className="text-3xl font-extrabold tracking-tight">{rp(saldo)}</p>
          <p className="mb-2 text-xs text-stone-500">dari jatah {rp(plafon)}</p>
          <Progress nilai={saldo} maks={plafon} />
          <p className="mt-2 text-xs text-stone-500">Diisi kembali ke jatah setiap hari Selasa.</p>
        </Card>
        <Card judul="Catat pengeluaran">
          <FormTransaksi akun={[kas]} kategori={katQ.data ?? []} jenisTetap="keluar" akunAwal={kas.id} />
        </Card>
      </div>
      <Card
        className="min-w-0"
        judul="Riwayat"
        aksi={
          <Link to="/laporan/kas-kecil" className="text-sm font-semibold text-hijau">
            Laporan bulanan
          </Link>
        }
      >
        <DaftarTransaksi data={trxQ.data} kategori={katQ.data ?? []} bolehBatal={isPemilik(user?.role)} memuat={trxQ.isLoading} />
      </Card>
    </div>
    </>
  );
}
