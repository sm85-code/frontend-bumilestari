import { useQuery } from "@tanstack/react-query";
import { Col, Flex, Row, Steps, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Input, InputTanggal, Lencana, Memuat, PageHeader, Select } from "../components/ui";
import { api, query } from "../lib/api";
import { useAkun, useAksi } from "../lib/data";
import { bersihkanAngka, hariIni, num, rp, tanggal } from "../lib/format";
import type { PengisianImprest, PiutangPelanggan, SiapBayar, Sisihan } from "../lib/types";

function Pengisian({ jenis, label }: { jenis: "kas-kecil" | "kas-iklan"; label: string }) {
  const q = useQuery({ queryKey: ["pengisian", jenis], queryFn: () => api<PengisianImprest>(`/${jenis}/pengisian`) });
  const aksi = useAksi();
  const d = q.data;
  const perlu = num(d?.perlu_diisi);
  return (
    <Flex vertical gap="small" align="flex-start">
      <ErrorBox error={q.error ?? aksi.error} />
      {d && (
        <>
          <Typography.Text>
            Saldo {label} <b>{rp(d.saldo)}</b> dari jatah <b>{rp(d.plafon)}</b> → perlu diisi{" "}
            <Typography.Text strong type={perlu > 0 ? "warning" : undefined}>
              {rp(perlu)}
            </Typography.Text>
          </Typography.Text>
          {perlu > 0 && !d.cukup && <Typography.Text type="danger">Saldo kas utama {rp(d.saldo_kas_utama)} belum cukup. Tarik saldo toko dulu.</Typography.Text>}
          <Button disabled={aksi.isPending || perlu <= 0 || !d.cukup} onClick={() => aksi.mutate({ path: `/${jenis}/pengisian` })}>
            {perlu <= 0 ? "Sudah penuh" : `Isi ${label} ${rp(perlu)}`}
          </Button>
        </>
      )}
    </Flex>
  );
}

const kolomSisihan: TableColumnsType<Sisihan["items"][number]> = [
  { title: "Karyawan", dataIndex: "nama" },
  { title: "Cicilan", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
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

  const langkah: { judul: string; status?: ReactNode; isi: ReactNode }[] = [
    {
      judul: "Terima pembayaran penjual lain",
      status: <Lencana warna={totalPiutang > 0 ? "oranye" : "hijau"}>{totalPiutang > 0 ? "ada tagihan" : "tidak ada"}</Lencana>,
      isi: (
        <Flex vertical gap="small" align="flex-start">
          <Typography.Text>
            Tagihan belum dibayar: <b>{rp(totalPiutang)}</b> dari {piutangQ.data?.length ?? 0} penjual.
          </Typography.Text>
          <Link to="/penjual-lain">Buka halaman Penjual lain →</Link>
        </Flex>
      ),
    },
    {
      judul: "Tarik saldo toko ke kas utama",
      isi:
        sumber.length === 0 ? (
          <Typography.Text type="secondary">Belum ada akun saldo toko (e-wallet/bank).</Typography.Text>
        ) : (
          <Flex vertical gap="small" align="flex-start" style={{ width: "100%" }}>
            <Row gutter={16} style={{ width: "100%" }}>
              <Col xs={24} md={12}>
                <Field label="Dari akun">
                  <Select value={sumberId} onChange={(e) => setDari(e.target.value)}>
                    {sumber.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama} ({rp(a.saldo)})
                      </option>
                    ))}
                  </Select>
                </Field>
              </Col>
              <Col xs={24} md={12}>
                <Field label="Jumlah (Rp)" hint={sumberPilih ? `Saldo ${rp(sumberPilih.saldo)}` : undefined}>
                  <Input inputMode="numeric" placeholder={sumberPilih ? String(Math.round(num(sumberPilih.saldo))) : "0"} value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
                </Field>
              </Col>
            </Row>
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
            <ErrorBox error={aksi.error} />
            <Typography.Text type="secondary">Pemasukan marketplace dicatat sendiri saat dana cair (halaman Keuangan); penarikan ini hanya memindahkan saldo.</Typography.Text>
          </Flex>
        ),
    },
    { judul: "Isi kas kecil", isi: <Pengisian jenis="kas-kecil" label="kas kecil" /> },
    ...(user?.role === "admin" ? [{ judul: "Isi kas iklan (admin)", isi: <Pengisian jenis="kas-iklan" label="kas iklan" /> }] : []),
    {
      judul: "Sisihkan dana gaji",
      status: s?.sudah_dicatat_id ? <Lencana warna="hijau">sudah dicatat</Lencana> : s && s.items.length === 0 ? <Lencana>tidak ada</Lencana> : undefined,
      isi: (
        <Flex vertical gap="small" align="flex-start" style={{ width: "100%" }}>
          <ErrorBox error={sisihanQ.error} />
          {s && (
            <>
              <Typography.Text type="secondary">
                Cicilan gaji {s.periode} · Selasa ke-{s.minggu_ke}. {s.catatan}
              </Typography.Text>
              {s.items.length > 0 && (
                <div style={{ width: "100%" }}>
                  <DataTabel kolom={kolomSisihan} data={s.items} rowKey="nama" minLebar={320} ringkasan={() => <BarisTotal sel={[{ isi: "Total" }, { isi: rp(s.total), kanan: true }]} />} />
                </div>
              )}
              {s.items.length > 0 && !s.cukup && <Typography.Text type="danger">Saldo kas utama {rp(s.saldo_kas_utama)} belum cukup.</Typography.Text>}
              <Button disabled={aksi.isPending || s.items.length === 0 || !!s.sudah_dicatat_id || !s.cukup} onClick={() => aksi.mutate({ path: "/sisihan", body: { tanggal: tgl } })}>
                Sisihkan {rp(s.total)}
              </Button>
            </>
          )}
        </Flex>
      ),
    },
    {
      judul: "Bayar tukang dan supplier",
      status: siap?.sudah_dicatat_id ? <Lencana warna="hijau">sudah dicatat</Lencana> : undefined,
      isi: (
        <Flex vertical gap="small" align="flex-start">
          {siap && (
            <Typography.Text>
              Siap dibayar: <b>{rp(siap.total)}</b> untuk {siap.pemasok.length} tukang/supplier (diambil sampai {tanggal(siap.batas_diambil)}).
            </Typography.Text>
          )}
          <Link to="/pesanan-tukang">Buka Pesanan ke tukang →</Link>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        judul="Selasa"
        sub="Urutan kerja mingguan; kerjakan dari atas ke bawah."
        aksi={
          <div style={{ width: 180 }}>
            <Field label="Tanggal">
              <InputTanggal value={tgl} onChange={setTgl} />
            </Field>
          </div>
        }
      />
      <Card>
        <Steps
          orientation="vertical"
          items={langkah.map((l) => ({
            status: "process" as const,
            title: (
              <Flex gap="small" align="center" wrap>
                <Typography.Text strong>{l.judul}</Typography.Text>
                {l.status}
              </Flex>
            ),
            content: l.isi,
          }))}
        />
      </Card>
    </>
  );
}
