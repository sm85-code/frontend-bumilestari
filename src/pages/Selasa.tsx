import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import type { TableColumnsType } from "antd";
import { BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Input, Lencana, Memuat, PageHeader, Select } from "../components/ui";
import { api, query } from "../lib/api";
import { useAkun, useAksi } from "../lib/data";
import { bersihkanAngka, hariIni, num, rp, tanggal } from "../lib/format";
import type { PengisianImprest, PiutangPelanggan, SiapBayar, Sisihan } from "../lib/types";

function Langkah({ no, judul, status, children }: { no: number; judul: string; status?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hijau text-sm font-bold text-white">{no}</span>
        <h2 className="flex-1 text-base font-bold">{judul}</h2>
        {status}
      </div>
      <div className="space-y-2 pl-0 md:pl-11">{children}</div>
    </Card>
  );
}

function Pengisian({ jenis, label }: { jenis: "kas-kecil" | "kas-iklan"; label: string }) {
  const q = useQuery({ queryKey: ["pengisian", jenis], queryFn: () => api<PengisianImprest>(`/${jenis}/pengisian`) });
  const aksi = useAksi();
  const d = q.data;
  const perlu = num(d?.perlu_diisi);
  return (
    <>
      <ErrorBox error={q.error ?? aksi.error} />
      {d && (
        <>
          <p className="text-sm">
            Saldo {label} <b>{rp(d.saldo)}</b> dari jatah <b>{rp(d.plafon)}</b> → perlu diisi <b className={perlu > 0 ? "text-oranye" : ""}>{rp(perlu)}</b>
          </p>
          {perlu > 0 && !d.cukup && <p className="text-sm text-red-600">Saldo kas utama {rp(d.saldo_kas_utama)} belum cukup. Tarik saldo toko dulu.</p>}
          <Button disabled={aksi.isPending || perlu <= 0 || !d.cukup} onClick={() => aksi.mutate({ path: `/${jenis}/pengisian` })}>
            {perlu <= 0 ? "Sudah penuh" : `Isi ${label} ${rp(perlu)}`}
          </Button>
        </>
      )}
    </>
  );
}

const kolomSisihan: TableColumnsType<Sisihan["items"][number]> = [
  { title: "Karyawan", dataIndex: "nama" },
  { title: "Cicilan", dataIndex: "jumlah", align: "right", render: (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span> },
];

export default function Selasa() {
  const { user } = useAuth();
  const [tgl, setTgl] = useState(hariIni());
  const akunQ = useAkun();
  const piutangQ = useQuery({ queryKey: ["piutang"], queryFn: () => api<PiutangPelanggan[]>("/piutang-reseller") });
  const sisihanQ = useQuery({ queryKey: ["sisihan", tgl], queryFn: () => api<Sisihan>(`/sisihan/hitung${query({ tanggal: tgl })}`) });
  const siapQ = useQuery({ queryKey: ["siap-bayar", tgl], queryFn: () => api<SiapBayar>(`/pembayaran-pemasok/siap${query({ tanggal: tgl })}`) });
  const aksi = useAksi();
  const [dari, setDari] = useState("");
  const [jumlah, setJumlah] = useState("");

  const akun = akunQ.data ?? [];
  const kasUtama = akun.find((a) => a.kode === "KAS_UTAMA");
  const sumber = akun.filter((a) => a.id !== kasUtama?.id && (a.jenis === "ewallet" || a.jenis === "bank"));
  const sumberId = dari || sumber[0]?.id || "";
  const sumberPilih = sumber.find((a) => a.id === sumberId);
  const totalPiutang = (piutangQ.data ?? []).reduce((t, p) => t + num(p.subtotal), 0);
  const s = sisihanQ.data;
  const siap = siapQ.data;

  if (!isPemilik(user?.role)) return null;
  if (akunQ.isLoading) return <Memuat />;

  return (
    <>
      <PageHeader
        judul="Selasa"
        sub="Urutan kerja mingguan; kerjakan dari atas ke bawah."
        aksi={
          <div className="w-44">
            <Field label="Tanggal">
              <Input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
            </Field>
          </div>
        }
      />

      <Langkah no={1} judul="Terima pembayaran penjual lain" status={<Lencana warna={totalPiutang > 0 ? "oranye" : "hijau"}>{totalPiutang > 0 ? "ada tagihan" : "tidak ada"}</Lencana>}>
        <p className="text-sm">
          Tagihan belum dibayar: <b>{rp(totalPiutang)}</b> dari {piutangQ.data?.length ?? 0} penjual.
        </p>
        <Link to="/penjual-lain" className="inline-block text-sm font-semibold text-hijau hover:underline">
          Buka halaman Penjual lain →
        </Link>
      </Langkah>

      <Langkah no={2} judul="Tarik saldo toko ke kas utama">
        {sumber.length === 0 ? (
          <p className="text-sm text-stone-500">Belum ada akun saldo toko (e-wallet/bank).</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Dari akun">
                <Select value={sumberId} onChange={(e) => setDari(e.target.value)}>
                  {sumber.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama} ({rp(a.saldo)})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Jumlah (Rp)" hint={sumberPilih ? `Saldo ${rp(sumberPilih.saldo)}` : undefined}>
                <Input inputMode="numeric" placeholder={sumberPilih ? String(Math.round(num(sumberPilih.saldo))) : "0"} value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              </Field>
            </div>
            <Button
              disabled={aksi.isPending || !kasUtama || !sumberId || !bersihkanAngka(jumlah || String(Math.round(num(sumberPilih?.saldo))))}
              onClick={() =>
                aksi.mutate(
                  {
                    path: "/transfer",
                    body: { tanggal: tgl, dari_akun_id: sumberId, ke_akun_id: kasUtama?.id, jumlah: bersihkanAngka(jumlah || String(Math.round(num(sumberPilih?.saldo)))), keterangan: "Tarik saldo toko" },
                  },
                  { onSuccess: () => setJumlah("") },
                )
              }
            >
              Tarik ke kas utama
            </Button>
          </>
        )}
        <ErrorBox error={aksi.error} />
        <p className="text-xs text-stone-500">Pemasukan marketplace dicatat sendiri saat dana cair (halaman Keuangan); penarikan ini hanya memindahkan saldo.</p>
      </Langkah>

      <Langkah no={3} judul="Isi kas kecil">
        <Pengisian jenis="kas-kecil" label="kas kecil" />
      </Langkah>

      {user?.role === "admin" && (
        <Langkah no={4} judul="Isi kas iklan (admin)">
          <Pengisian jenis="kas-iklan" label="kas iklan" />
        </Langkah>
      )}

      <Langkah
        no={5}
        judul="Sisihkan dana gaji"
        status={s?.sudah_dicatat_id ? <Lencana warna="hijau">sudah dicatat</Lencana> : s && s.items.length === 0 ? <Lencana>tidak ada</Lencana> : undefined}
      >
        <ErrorBox error={sisihanQ.error} />
        {s && (
          <>
            <p className="text-xs text-stone-500">
              Cicilan gaji {s.periode} · Selasa ke-{s.minggu_ke}. {s.catatan}
            </p>
            {s.items.length > 0 && (
              <DataTabel
                kolom={kolomSisihan}
                data={s.items}
                rowKey="nama"
                minLebar={320}
                ringkasan={() => <BarisTotal sel={[{ isi: "Total" }, { isi: rp(s.total), kanan: true }]} />}
              />
            )}
            {s.items.length > 0 && !s.cukup && <p className="text-sm text-red-600">Saldo kas utama {rp(s.saldo_kas_utama)} belum cukup.</p>}
            <Button disabled={aksi.isPending || s.items.length === 0 || !!s.sudah_dicatat_id || !s.cukup} onClick={() => aksi.mutate({ path: "/sisihan", body: { tanggal: tgl } })}>
              Sisihkan {rp(s.total)}
            </Button>
          </>
        )}
      </Langkah>

      <Langkah no={6} judul="Bayar tukang dan supplier" status={siap?.sudah_dicatat_id ? <Lencana warna="hijau">sudah dicatat</Lencana> : undefined}>
        {siap && (
          <p className="text-sm">
            Siap dibayar: <b>{rp(siap.total)}</b> untuk {siap.pemasok.length} tukang/supplier (diambil sampai {tanggal(siap.batas_diambil)}).
          </p>
        )}
        <Link to="/pesanan-tukang" className="inline-block text-sm font-semibold text-hijau hover:underline">
          Buka Pesanan ke tukang →
        </Link>
      </Langkah>
    </>
  );
}
