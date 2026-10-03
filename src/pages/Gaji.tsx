import { useQuery } from "@tanstack/react-query";
import { PlusOutlined } from "@ant-design/icons";
import { Col, Row, Space, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Angka, AksiForm, BarisTotal, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, InputTanggal, Lencana, PageHeader, Select, Tabs, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { peta, useAkun, useAksi } from "../lib/data";
import { useFields } from "../lib/form";
import { bersihkanAngka, bulanIni, bulanTahun, hariIni, num, rp, tanggal } from "../lib/format";
import type { Gaji, Karyawan, Langganan, Tagihan } from "../lib/types";

const PERAN: Record<string, string> = {
  kas_kecil_packing: "Pemegang kas kecil + packing",
  order_non_kayu: "Order non kayu",
  tukang_cat: "Tukang cat (utama)",
  asisten_tukang_cat: "Asisten tukang cat",
  lainnya: "Lainnya",
};

function FormKaryawan({ awal, onSelesai }: { awal?: Karyawan; onSelesai: () => void }) {
  const aksi = useAksi();
  const { f, bind } = useFields({ nama: awal?.nama ?? "", peran: awal?.peran ?? "lainnya", gaji: awal ? String(Math.round(num(awal.gaji_bulanan))) : "" });
  return (
    <Formulir
      onKirim={() => {
        const body = { nama: f.nama.trim(), peran: f.peran, gaji_bulanan: bersihkanAngka(f.gaji) || "0" };
        aksi.mutate(awal ? { path: `/karyawan/${awal.id}`, method: "PATCH", body } : { path: "/karyawan", body }, { onSuccess: onSelesai });
      }}
    >
      <Field label="Nama">
        <Input required {...bind("nama")} />
      </Field>
      <Field label="Peran">
        <Select {...bind("peran")}>
          {Object.entries(PERAN).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Gaji per bulan (Rp)" hint="Admin dan owner tidak bergaji (hanya bagi hasil)">
        <Input inputMode="numeric" required {...bind("gaji")} />
      </Field>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
          Simpan
        </Button>
      </AksiForm>
    </Formulir>
  );
}

function TabKaryawan() {
  const [periode, setPeriode] = useState(bulanIni());
  const [form, setForm] = useState<Karyawan | "baru" | null>(null);
  const karyawanQ = useQuery({ queryKey: ["karyawan"], queryFn: () => api<Karyawan[]>("/karyawan") });
  const gajiQ = useQuery({ queryKey: ["gaji", periode], queryFn: () => api<Gaji[]>(`/gaji${query({ periode })}`) });
  const dana = useAkun().data?.find((a) => a.kode === "DANA_CADANGAN");
  const aksi = useAksi();
  const { konfirmasi, konfirmasiTanggal, tanya } = useDialog();
  const nama = peta(karyawanQ.data);
  const belum = (gajiQ.data ?? []).filter((g) => !g.tanggal_bayar);
  const totalBelum = belum.reduce((t, g) => t + num(g.jumlah), 0);
  const angka = (v: string) => <Angka>{rp(v)}</Angka>;
  const kolomKaryawan: TableColumnsType<Karyawan> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 160 },
    { title: "Peran", dataIndex: "peran", render: (v: string) => <Typography.Text type="secondary">{PERAN[v] ?? v}</Typography.Text> },
    { title: "Gaji / bulan", dataIndex: "gaji_bulanan", align: "right", render: angka },
    {
      title: "Aksi",
      width: 190,
      render: (_, k) => (
        <Space size={0}>
          <TombolLink onClick={() => setForm(k)}>Ubah</TombolLink>
          <TombolLink
            bahaya
            onClick={() => void konfirmasi(`Nonaktifkan ${k.nama}?`, { ok: "Nonaktifkan", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/karyawan/${k.id}`, method: "PATCH", body: { aktif: false } }))}
          >
            Nonaktifkan
          </TombolLink>
        </Space>
      ),
    },
  ];
  const kolomGaji: TableColumnsType<Gaji> = [
    { title: "Karyawan", dataIndex: "karyawan_id", fixed: "left", width: 160, render: (v: string) => nama.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: angka },
    { title: "Jatuh tempo", dataIndex: "jatuh_tempo", render: (v: string) => <Angka>{tanggal(v)}</Angka> },
    { title: "Status", render: (_, g) => (g.tanggal_bayar ? <Lencana warna="hijau">dibayar {tanggal(g.tanggal_bayar)}</Lencana> : <Lencana warna="oranye">belum</Lencana>) },
    {
      title: "Aksi",
      width: 150,
      render: (_, g) =>
        g.tanggal_bayar && (
          <TombolLink
            bahaya
            onClick={() =>
              void tanya("Batalkan pembayaran gaji ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan pembayaran" }).then(
                (alasan) => alasan && aksi.mutate({ path: `/gaji/${g.id}/batal-bayar`, body: { alasan } }),
              )
            }
          >
            Batalkan bayar
          </TombolLink>
        ),
    },
  ];

  return (
    <>
      <Card judul="Karyawan tetap" aksi={<Button kecil onClick={() => setForm("baru")}><PlusOutlined /> Karyawan</Button>}>
        <DataTabel kolom={kolomKaryawan} data={karyawanQ.data ?? []} rowKey="id" minLebar={520} kosong="Belum ada karyawan." />
      </Card>

      <Card judul="Gaji bulanan (dibayar tanggal 1 bulan berikutnya, dari Dana cadangan)">
        <Row gutter={16} align="bottom">
          <Col xs={24} md={6}>
            <Field label="Periode gaji">
              <InputTanggal bulan value={periode} onChange={setPeriode} />
            </Field>
          </Col>
          <Col xs={24} md={18}>
            <Space wrap style={{ marginBottom: 24 }}>
              <Button variant="pinggir" disabled={aksi.isPending} onClick={() => aksi.mutate({ path: "/gaji/siapkan", body: { periode } })}>
                Siapkan gaji
              </Button>
              <Button
                disabled={aksi.isPending || belum.length === 0}
                onClick={() =>
                  void konfirmasiTanggal(`Bayar gaji ${bulanTahun(periode)} sebesar ${rp(totalBelum)} dari Dana cadangan?`, {
                    awal: hariIni(),
                    label: "Tanggal bayar",
                    ok: "Bayar gaji",
                  }).then((tgl) => tgl && aksi.mutate({ path: "/gaji/bayar", body: { periode, tanggal: tgl } }))
                }
              >
                Bayar semua ({rp(totalBelum)})
              </Button>
            </Space>
          </Col>
        </Row>
        <Typography.Paragraph type="secondary">
          Saldo Dana cadangan: <b>{rp(dana?.saldo)}</b>. Kurang? Isi lewat transfer atau sisihkan di Rutinitas Selasa.
        </Typography.Paragraph>
        <ErrorBox error={gajiQ.error ?? aksi.error} />
        <DataTabel
          kolom={kolomGaji}
          data={gajiQ.data ?? []}
          rowKey="id"
          minLebar={560}
          kosong="Belum ada gaji untuk periode ini. Tekan 'Siapkan gaji'."
          ringkasan={gajiQ.data?.length ? () => <BarisTotal sel={[{ isi: "Total" }, { isi: rp(gajiQ.data!.reduce((t, g) => t + num(g.jumlah), 0)), kanan: true }, { isi: "", span: 3 }]} /> : undefined}
        />
      </Card>
      {form && (
        <Dialog judul={form === "baru" ? "Karyawan baru" : `Ubah ${form.nama}`} onTutup={() => setForm(null)}>
          <FormKaryawan awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </>
  );
}

function TabLangganan() {
  const [periode, setPeriode] = useState(bulanIni());
  const [baru, setBaru] = useState(false);
  const [bayar, setBayar] = useState(false);
  const langgananQ = useQuery({ queryKey: ["langganan"], queryFn: () => api<Langganan[]>("/langganan") });
  const tagihanQ = useQuery({ queryKey: ["tagihan", periode], queryFn: () => api<Tagihan[]>(`/tagihan${query({ periode })}`) });
  const aksi = useAksi();
  const { tanya, message } = useDialog();
  const nama = peta(langgananQ.data);
  const sudah = new Set((tagihanQ.data ?? []).filter((t) => !t.dibatalkan).map((t) => t.langganan_id));
  const { f, bind, reset } = useFields({ nama: "", jumlah: "" });
  const [angka, setAngka] = useState<Record<string, string>>({});
  const [tglBayar, setTglBayar] = useState(hariIni());
  const rupiah = (v: string) => <Angka>{rp(v)}</Angka>;
  const kolomLangganan: TableColumnsType<Langganan> = [
    { title: "Tagihan rutin", dataIndex: "nama", fixed: "left", width: 160 },
    { title: "Perkiraan / bulan", dataIndex: "jumlah_bulanan", align: "right", render: rupiah },
    {
      title: "Aksi",
      width: 150,
      render: (_, l) => (
        <TombolLink
          onClick={() =>
            void tanya(`Ubah nominal ${l.nama}`, { label: "Perkiraan tagihan per bulan (Rp)", awal: String(Math.round(num(l.jumlah_bulanan))) }).then(
              (v) => v !== null && aksi.mutate({ path: `/langganan/${l.id}`, method: "PATCH", body: { jumlah_bulanan: bersihkanAngka(v) || "0" } }),
            )
          }
        >
          Ubah nominal
        </TombolLink>
      ),
    },
  ];
  const kolomTagihan: TableColumnsType<Tagihan> = [
    { title: "Tagihan rutin", dataIndex: "langganan_id", fixed: "left", width: 160, render: (v: string) => nama.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: rupiah },
    { title: "Dibayar", render: (_, t) => (t.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <Angka>{tanggal(t.tanggal_bayar)}</Angka>) },
    {
      title: "Aksi",
      width: 110,
      render: (_, t) =>
        !t.dibatalkan && (
          <TombolLink
            bahaya
            onClick={() =>
              void tanya("Batalkan tagihan ini?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan tagihan" }).then(
                (alasan) => alasan && aksi.mutate({ path: `/tagihan/${t.id}/batal`, body: { alasan } }),
              )
            }
          >
            Batalkan
          </TombolLink>
        ),
    },
  ];

  return (
    <>
      <Card judul="Daftar tagihan rutin" aksi={<Button kecil onClick={() => setBaru(true)}><PlusOutlined /> Tagihan rutin</Button>}>
        <Typography.Paragraph type="secondary">Dibayar langsung saat tagihan datang (biasanya minggu ke-4); tidak dicicil. Nominal di sini hanya perkiraan.</Typography.Paragraph>
        <DataTabel kolom={kolomLangganan} data={langgananQ.data ?? []} rowKey="id" minLebar={460} kosong="Belum ada tagihan rutin (listrik, air, wifi, …). Tekan '+ Tagihan rutin'." />
      </Card>

      <Card judul="Bayar tagihan rutin">
        <Row gutter={16} align="bottom">
          <Col xs={24} md={6}>
            <Field label="Periode tagihan">
              <InputTanggal bulan value={periode} onChange={setPeriode} />
            </Field>
          </Col>
          <Col xs={24} md={18}>
            <div style={{ marginBottom: 24 }}>
              <Button
                onClick={() => {
                  setAngka(Object.fromEntries((langgananQ.data ?? []).map((l) => [l.id, String(Math.round(num(l.jumlah_bulanan)))])));
                  setTglBayar(hariIni());
                  setBayar(true);
                }}
              >
                Bayar tagihan…
              </Button>
            </div>
          </Col>
        </Row>
        <ErrorBox error={tagihanQ.error ?? aksi.error} />
        <DataTabel kolom={kolomTagihan} data={tagihanQ.data ?? []} rowKey="id" minLebar={500} kosong="Belum ada tagihan dibayar untuk periode ini." />
      </Card>

      {baru && (
        <Dialog judul="Tagihan rutin baru" onTutup={() => setBaru(false)}>
          <Formulir
            onKirim={() =>
              aksi.mutate(
                { path: "/langganan", body: { nama: f.nama.trim(), jumlah_bulanan: bersihkanAngka(f.jumlah) || "0" } },
                {
                  onSuccess: () => {
                    reset();
                    setBaru(false);
                  },
                },
              )
            }
          >
            <Field label="Nama">
              <Input required {...bind("nama")} />
            </Field>
            <Field label="Perkiraan per bulan (Rp)">
              <Input inputMode="numeric" {...bind("jumlah")} />
            </Field>
            <AksiForm error={aksi.error}>
              <Button type="submit" disabled={aksi.isPending} penuh>
                Simpan
              </Button>
            </AksiForm>
          </Formulir>
        </Dialog>
      )}
      {bayar && (
        <Dialog judul={`Bayar tagihan rutin ${bulanTahun(periode)}`} onTutup={() => setBayar(false)}>
          <Typography.Paragraph type="secondary">Isi tagihan sebenarnya (kosongkan/0 untuk dilewati). Dibayar dari kas utama.</Typography.Paragraph>
          <Formulir
            onKirim={() => {
              const items = (langgananQ.data ?? [])
                .filter((l) => !sudah.has(l.id) && num(bersihkanAngka(angka[l.id] ?? "")) > 0)
                .map((l) => ({ langganan_id: l.id, jumlah: bersihkanAngka(angka[l.id] ?? "") }));
              if (items.length === 0) {
                message.warning("Isi minimal satu tagihan.");
                return;
              }
              aksi.mutate({ path: "/tagihan/bayar", body: { periode, tanggal: tglBayar, items } }, { onSuccess: () => setBayar(false) });
            }}
          >
            {(langgananQ.data ?? []).map((l) => (
              <Field key={l.id} label={`${l.nama}${sudah.has(l.id) ? " (sudah dibayar)" : ""}`}>
                <Input inputMode="numeric" disabled={sudah.has(l.id)} value={angka[l.id] ?? ""} onChange={(e) => setAngka((a) => ({ ...a, [l.id]: e.target.value }))} />
              </Field>
            ))}
            <Field label="Tanggal bayar">
              <InputTanggal value={tglBayar} onChange={setTglBayar} />
            </Field>
            <AksiForm error={aksi.error}>
              <Button type="submit" disabled={aksi.isPending || !tglBayar} penuh>
                Bayar
              </Button>
            </AksiForm>
          </Formulir>
        </Dialog>
      )}
    </>
  );
}

export default function GajiPage() {
  const [tab, setTab] = useState<"gaji" | "langganan">("gaji");
  return (
    <>
      <PageHeader judul="Gaji & tagihan rutin" sub="Karyawan tetap, gaji bulanan, dan tagihan rutin (listrik, air, wifi, …)" />
      <Tabs
        daftar={[
          { id: "gaji", label: "Karyawan & gaji" },
          { id: "langganan", label: "Tagihan rutin" },
        ]}
        aktif={tab}
        onPilih={setTab}
      />
      {tab === "gaji" ? <TabKaryawan /> : <TabLangganan />}
    </>
  );
}
