import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { BarisTotal, Button, Card, DataTabel, Dialog, ErrorBox, Field, Input, Lencana, PageHeader, Select, Tabs, TombolLink } from "../components/ui";
import { api, query } from "../lib/api";
import { peta, useAkun, useAksi } from "../lib/data";
import { useFields } from "../lib/form";
import { bersihkanAngka, bulanIni, hariIni, num, rp, tanggal } from "../lib/format";
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
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
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
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

function TabKaryawan() {
  const [periode, setPeriode] = useState(bulanIni());
  const [form, setForm] = useState<Karyawan | "baru" | null>(null);
  const karyawanQ = useQuery({ queryKey: ["karyawan"], queryFn: () => api<Karyawan[]>("/karyawan") });
  const gajiQ = useQuery({ queryKey: ["gaji", periode], queryFn: () => api<Gaji[]>(`/gaji${query({ periode })}`) });
  const dana = useAkun().data?.find((a) => a.kode === "DANA_CADANGAN");
  const aksi = useAksi();
  const nama = peta(karyawanQ.data);
  const belum = (gajiQ.data ?? []).filter((g) => !g.tanggal_bayar);
  const totalBelum = belum.reduce((t, g) => t + num(g.jumlah), 0);
  const angka = (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span>;
  const kolomKaryawan: TableColumnsType<Karyawan> = [
    { title: "Nama", dataIndex: "nama", fixed: "left", width: 160 },
    { title: "Peran", dataIndex: "peran", render: (v: string) => <span className="text-coklat">{PERAN[v] ?? v}</span> },
    { title: "Gaji / bulan", dataIndex: "gaji_bulanan", align: "right", render: angka },
    {
      title: "Aksi",
      width: 170,
      render: (_, k) => (
        <span className="whitespace-nowrap">
          <TombolLink onClick={() => setForm(k)}>Ubah</TombolLink>
          <TombolLink bahaya onClick={() => window.confirm(`Nonaktifkan ${k.nama}?`) && aksi.mutate({ path: `/karyawan/${k.id}`, method: "PATCH", body: { aktif: false } })}>
            Nonaktifkan
          </TombolLink>
        </span>
      ),
    },
  ];
  const kolomGaji: TableColumnsType<Gaji> = [
    { title: "Karyawan", dataIndex: "karyawan_id", fixed: "left", width: 160, render: (v: string) => nama.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: angka },
    { title: "Jatuh tempo", dataIndex: "jatuh_tempo", render: (v: string) => <span className="whitespace-nowrap">{tanggal(v)}</span> },
    { title: "Status", render: (_, g) => (g.tanggal_bayar ? <Lencana warna="hijau">dibayar {tanggal(g.tanggal_bayar)}</Lencana> : <Lencana warna="oranye">belum</Lencana>) },
    {
      title: "Aksi",
      width: 150,
      render: (_, g) =>
        g.tanggal_bayar && (
          <TombolLink
            bahaya
            onClick={() => {
              const alasan = window.prompt("Alasan membatalkan pembayaran gaji ini?");
              if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/gaji/${g.id}/batal-bayar`, body: { alasan: alasan.trim() } });
            }}
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
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Field label="Periode gaji">
              <Input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            </Field>
          </div>
          <Button variant="pinggir" disabled={aksi.isPending} onClick={() => aksi.mutate({ path: "/gaji/siapkan", body: { periode } })}>
            Siapkan gaji
          </Button>
          <Button disabled={aksi.isPending || belum.length === 0} onClick={() => window.confirm(`Bayar gaji ${periode} sebesar ${rp(totalBelum)} dari Dana cadangan?`) && aksi.mutate({ path: "/gaji/bayar", body: { periode, tanggal: hariIni() } })}>
            Bayar semua ({rp(totalBelum)})
          </Button>
        </div>
        <p className="mb-2 text-xs text-stone-500">Saldo Dana cadangan: <b>{rp(dana?.saldo)}</b>. Kurang? Isi lewat transfer atau sisihkan di halaman Selasa.</p>
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
  const nama = peta(langgananQ.data);
  const sudah = new Set((tagihanQ.data ?? []).filter((t) => !t.dibatalkan).map((t) => t.langganan_id));
  const { f, bind, reset } = useFields({ nama: "", jumlah: "" });
  const [angka, setAngka] = useState<Record<string, string>>({});
  const rupiah = (v: string) => <span className="tabular-nums whitespace-nowrap">{rp(v)}</span>;
  const kolomLangganan: TableColumnsType<Langganan> = [
    { title: "Langganan", dataIndex: "nama", fixed: "left", width: 160 },
    { title: "Perkiraan / bulan", dataIndex: "jumlah_bulanan", align: "right", render: rupiah },
    {
      title: "Aksi",
      width: 140,
      render: (_, l) => (
        <TombolLink
          onClick={() => {
            const v = window.prompt(`Perkiraan tagihan ${l.nama} per bulan (Rp)?`, String(Math.round(num(l.jumlah_bulanan))));
            if (v !== null) aksi.mutate({ path: `/langganan/${l.id}`, method: "PATCH", body: { jumlah_bulanan: bersihkanAngka(v) || "0" } });
          }}
        >
          Ubah nominal
        </TombolLink>
      ),
    },
  ];
  const kolomTagihan: TableColumnsType<Tagihan> = [
    { title: "Langganan", dataIndex: "langganan_id", fixed: "left", width: 160, render: (v: string) => nama.get(v)?.nama ?? "—" },
    { title: "Jumlah", dataIndex: "jumlah", align: "right", render: rupiah },
    { title: "Dibayar", render: (_, t) => (t.dibatalkan ? <Lencana warna="merah">dibatalkan</Lencana> : <span className="whitespace-nowrap">{tanggal(t.tanggal_bayar)}</span>) },
    {
      title: "Aksi",
      width: 110,
      render: (_, t) =>
        !t.dibatalkan && (
          <TombolLink
            bahaya
            onClick={() => {
              const alasan = window.prompt("Alasan membatalkan tagihan ini?");
              if (alasan && alasan.trim().length >= 3) aksi.mutate({ path: `/tagihan/${t.id}/batal`, body: { alasan: alasan.trim() } });
            }}
          >
            Batalkan
          </TombolLink>
        ),
    },
  ];

  return (
    <>
      <Card judul="Daftar langganan" aksi={<Button kecil onClick={() => setBaru(true)}><PlusOutlined /> Langganan</Button>}>
        <p className="mb-2 text-xs text-stone-500">Dibayar langsung saat tagihan datang (biasanya minggu ke-4); tidak dicicil. Nominal di sini hanya perkiraan.</p>
        <DataTabel kolom={kolomLangganan} data={langgananQ.data ?? []} rowKey="id" minLebar={460} kosong="Belum ada langganan." />
      </Card>

      <Card judul="Bayar tagihan">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Field label="Periode tagihan">
              <Input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            </Field>
          </div>
          <Button onClick={() => { setAngka(Object.fromEntries((langgananQ.data ?? []).map((l) => [l.id, String(Math.round(num(l.jumlah_bulanan)))]))); setBayar(true); }}>
            Bayar tagihan…
          </Button>
        </div>
        <ErrorBox error={tagihanQ.error ?? aksi.error} />
        <DataTabel kolom={kolomTagihan} data={tagihanQ.data ?? []} rowKey="id" minLebar={500} kosong="Belum ada tagihan dibayar untuk periode ini." />
      </Card>

      {baru && (
        <Dialog judul="Langganan baru" onTutup={() => setBaru(false)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              aksi.mutate({ path: "/langganan", body: { nama: f.nama.trim(), jumlah_bulanan: bersihkanAngka(f.jumlah) || "0" } }, { onSuccess: () => { reset(); setBaru(false); } });
            }}
          >
            <Field label="Nama">
              <Input required {...bind("nama")} />
            </Field>
            <Field label="Perkiraan per bulan (Rp)">
              <Input inputMode="numeric" {...bind("jumlah")} />
            </Field>
            <ErrorBox error={aksi.error} />
            <Button type="submit" disabled={aksi.isPending} className="w-full">
              Simpan
            </Button>
          </form>
        </Dialog>
      )}
      {bayar && (
        <Dialog judul={`Bayar tagihan ${periode}`} onTutup={() => setBayar(false)}>
          <p className="mb-2 text-xs text-stone-500">Isi tagihan sebenarnya (kosongkan/0 untuk dilewati). Dibayar dari kas utama.</p>
          <div className="space-y-3">
            {(langgananQ.data ?? []).map((l) => (
              <Field key={l.id} label={`${l.nama}${sudah.has(l.id) ? " (sudah dibayar)" : ""}`}>
                <Input inputMode="numeric" disabled={sudah.has(l.id)} value={angka[l.id] ?? ""} onChange={(e) => setAngka((a) => ({ ...a, [l.id]: e.target.value }))} />
              </Field>
            ))}
            <ErrorBox error={aksi.error} />
            <Button
              className="w-full"
              disabled={aksi.isPending}
              onClick={() => {
                const items = (langgananQ.data ?? [])
                  .filter((l) => !sudah.has(l.id) && num(bersihkanAngka(angka[l.id] ?? "")) > 0)
                  .map((l) => ({ langganan_id: l.id, jumlah: bersihkanAngka(angka[l.id] ?? "") }));
                if (items.length === 0) return window.alert("Isi minimal satu tagihan.");
                aksi.mutate({ path: "/tagihan/bayar", body: { periode, tanggal: hariIni(), items } }, { onSuccess: () => setBayar(false) });
              }}
            >
              Bayar
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default function GajiPage() {
  const [tab, setTab] = useState<"gaji" | "langganan">("gaji");
  return (
    <>
      <PageHeader judul="Gaji dan langganan" sub="Karyawan tetap, gaji bulanan, dan tagihan langganan" />
      <Tabs
        daftar={[
          { id: "gaji", label: "Karyawan & gaji" },
          { id: "langganan", label: "Langganan" },
        ]}
        aktif={tab}
        onPilih={setTab}
      />
      {tab === "gaji" ? <TabKaryawan /> : <TabLangganan />}
    </>
  );
}
