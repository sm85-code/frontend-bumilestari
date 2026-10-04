import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox, Col, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import KirimKeLaporan from "../components/KirimKeLaporan";
import { AksiForm, Angka, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, InputTanggal, Lencana, Memuat, PageHeader, Select, Stat, TombolLink, useDialog } from "../components/ui";
import { api, unggah } from "../lib/api";
import { useAksi, useSaluran } from "../lib/data";
import { bersihkanAngka, hariIni, rp, tanggal } from "../lib/format";
import { formulir, LABEL_KELOMPOK, URUTAN_KELOMPOK, useFormatPenghasilan, usePencairan, WARNA_KELOMPOK } from "../lib/pencairan";
import type { BarisStandar, BelumCair, MasalahBaris, PencairanBaris, PencairanUnggahan, PratinjauPencairan, Saluran } from "../lib/types";

/**
 * Pencairan marketplace & iPaymu (spesifikasi 8.3, Fase 2.4/2.5). File "Penghasilan Saya" dibaca memakai format aktif
 * saluran, dicocokkan ke order (kode pesanan), lalu disimpan sebagai draf. Pembukuan (penjualan, potongan, status cair
 * order) terjadi saat "Kirim ke laporan". Baris yang tidak ditemukan disimpan menunggu dan dicocokkan ulang nanti.
 * "Catat manual" (semua saluran marketplace & Toko web) untuk masa transisi atau bila file belum ada: masuk tabel
 * pencairan yang sama sebagai draf; impor file berikutnya melewati kode pesanan yang sudah dicatat manual.
 */
export default function PencairanPage() {
  const saluranQ = useSaluran();
  const pilihan = (saluranQ.data ?? []).filter((s) => s.aktif && s.jenis !== "reseller");
  const [sid, setSid] = useState("");
  const saluran = pilihan.find((s) => s.id === sid) ?? pilihan[0];

  if (saluranQ.isLoading) return <Memuat />;
  return (
    <>
      <PageHeader judul="Pencairan" sub="Catat uang yang cair dari marketplace dan iPaymu. Order baru dianggap cair setelah dikirim ke laporan." />
      <ErrorBox error={saluranQ.error} />
      <Card
        judul="Catat pencairan"
        aksi={
          <Select aria-label="Saluran" value={saluran?.id ?? ""} onChange={(e) => setSid(e.target.value)}>
            {pilihan.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </Select>
        }
      >
        {saluran && <CatatPencairan key={saluran.id} saluran={saluran} />}
      </Card>
      <Card judul="Kirim ke laporan">
        <KirimKeLaporan sumber="pencairan" tanpaTautan />
      </Card>
      <Riwayat saluran={pilihan} />
    </>
  );
}

function CatatPencairan({ saluran }: { saluran: Saluran }) {
  const [mode, setMode] = useState<"file" | "manual">(saluran.jenis === "web" ? "manual" : "file");
  return (
    <Flex vertical gap="middle" style={{ width: "100%" }}>
      <Flex gap="small" wrap align="center">
        <Button kecil variant={mode === "file" ? "utama" : "pinggir"} onClick={() => setMode("file")}>
          Impor file
        </Button>
        <Button kecil variant={mode === "manual" ? "utama" : "pinggir"} onClick={() => setMode("manual")}>
          Catat manual
        </Button>
        <Typography.Text type="secondary">Catat manual: untuk masa transisi atau bila file belum ada</Typography.Text>
      </Flex>
      {mode === "file" ? <UnggahFile saluran={saluran} /> : <FormManual saluran={saluran} />}
    </Flex>
  );
}

function UnggahFile({ saluran }: { saluran: Saluran }) {
  const qc = useQueryClient();
  const fmt = useFormatPenghasilan(saluran.id);
  const aktif = fmt.data?.find((f) => f.status === "aktif");
  const draf = fmt.data?.find((f) => f.status === "draf");
  const [file, setFile] = useState<File | null>(null);
  const [kunci, setKunci] = useState(0);
  const [hasil, setHasil] = useState<PratinjauPencairan | null>(null);
  const [gantiManual, setGantiManual] = useState(false);
  const pratinjau = useMutation({
    mutationFn: (f: File) => unggah<PratinjauPencairan>("/pencairan/pratinjau", formulir({ saluran_id: saluran.id, file: f })),
    onSuccess: setHasil,
  });
  const simpan = useMutation({
    mutationFn: (f: File) => unggah<PencairanUnggahan>("/pencairan", formulir({ saluran_id: saluran.id, file: f, ganti_manual: gantiManual ? "true" : null })),
    onSuccess: () => {
      setHasil(null);
      setGantiManual(false);
      setFile(null);
      setKunci((k) => k + 1);
      void qc.invalidateQueries();
    },
  });

  if (fmt.isLoading) return <Memuat />;
  if (!aktif)
    return (
      <Typography.Text type="secondary">
        Belum ada format file penghasilan aktif untuk {saluran.nama}.{" "}
        {draf ? `Ada draf "${draf.nama}" (versi ${draf.versi}); uji dengan file asli lalu aktifkan` : "Buat formatnya"} di Data master &gt; Saluran &gt; Format file penghasilan.
      </Typography.Text>
    );
  return (
    <Flex vertical gap="middle" style={{ width: "100%" }}>
      <Typography.Text type="secondary">
        Format: {aktif.nama} (versi {aktif.versi}). Unggah file .{aktif.jenis_file} dari seller center, periksa pratinjaunya, lalu simpan.
      </Typography.Text>
      <Flex gap="small" wrap align="center">
        <input
          key={kunci}
          type="file"
          aria-label="File penghasilan"
          accept=".xlsx,.csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setHasil(null);
            setGantiManual(false);
          }}
        />
        <Button variant="pinggir" disabled={!file || pratinjau.isPending} onClick={() => file && pratinjau.mutate(file)}>
          {pratinjau.isPending ? "Membaca…" : "Pratinjau"}
        </Button>
      </Flex>
      <ErrorBox error={pratinjau.error ?? simpan.error} />
      {hasil && (
        <>
          <Row gutter={[16, 16]}>
            {URUTAN_KELOMPOK.map((k) => (
              <Col key={k} xs={12} md={8} lg={4}>
                <Stat label={LABEL_KELOMPOK[k]} nilai={String(hasil.kelompok[k]?.jumlah ?? 0)} sub={rp(hasil.kelompok[k]?.total_cair ?? 0)} />
              </Col>
            ))}
            <Col xs={12} md={8} lg={4}>
              <Stat label="Bermasalah" nilai={String(hasil.bermasalah)} warna={hasil.bermasalah ? "merah" : undefined} />
            </Col>
          </Row>
          {hasil.neto && <Typography.Text type="warning">File ini hanya berisi jumlah bersih; penjualan dicatat sebesar uang yang cair (mode neto).</Typography.Text>}
          <TabelBaris baris={hasil.baris} />
          <DaftarMasalah masalah={hasil.masalah} />
          {(hasil.sudah_manual ?? 0) > 0 && (
            <Flex vertical gap={4} data-sudah-manual>
              <Typography.Text type="warning">
                {hasil.sudah_manual} baris sudah dicatat manual dan dilewati agar tidak terhitung dua kali.
              </Typography.Text>
              {(hasil.manual_bisa_diganti ?? 0) > 0 && (
                <Checkbox checked={gantiManual} onChange={(e) => setGantiManual(e.target.checked)}>
                  Ganti {hasil.manual_bisa_diganti} entri manual yang masih draf dengan isi file ini
                </Checkbox>
              )}
            </Flex>
          )}
          <Flex gap="small" align="center" wrap>
            <Button
              disabled={simpan.isPending || (hasil.jumlah_disimpan === 0 && !(gantiManual && (hasil.manual_bisa_diganti ?? 0) > 0))}
              onClick={() => file && simpan.mutate(file)}
            >
              Simpan pencairan
            </Button>
            <Typography.Text type="secondary">
              {hasil.jumlah_disimpan} baris disimpan sebagai draf, {rp(hasil.total_dibukukan)} dibukukan saat dikirim ke laporan. Baris "Tidak ditemukan" disimpan menunggu; baris
              "Sudah pernah dicatat" dilewati.
            </Typography.Text>
          </Flex>
        </>
      )}
    </Flex>
  );
}

function TabelBaris({ baris }: { baris: BarisStandar[] }) {
  const kolom: TableColumnsType<BarisStandar> = [
    { title: "Baris", dataIndex: "baris_file", width: 70 },
    { title: "Kode pesanan", dataIndex: "kode_pesanan" },
    { title: "Tanggal", dataIndex: "tanggal_cair", render: (v: string) => tanggal(v) },
    { title: "Harga jual", dataIndex: "harga_jual", align: "right", render: (v: string | null) => (v === null ? "-" : <Angka>{rp(v)}</Angka>) },
    { title: "Potongan", dataIndex: "potongan_biaya", align: "right", render: (v: string | null) => (v === null ? "-" : <Angka>{rp(v)}</Angka>) },
    { title: "Cair", dataIndex: "jumlah_cair", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    {
      title: "Hasil",
      render: (_, b) => (
        <Flex vertical>
          <span>
            {b.dicatat_manual ? <Lencana warna="abu">Sudah dicatat manual</Lencana> : <Lencana warna={WARNA_KELOMPOK[b.kelompok]}>{LABEL_KELOMPOK[b.kelompok]}</Lencana>}
            {b.jenis_baris === "retur" && <Lencana warna="merah">Retur</Lencana>}
          </span>
          {b.alasan && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {b.alasan}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
  ];
  return <DataTabel kolom={kolom} data={baris} rowKey={(b) => `${b.baris_file}-${b.kode_pesanan}`} minLebar={820} kosong="Tidak ada baris yang terbaca" />;
}

function DaftarMasalah({ masalah }: { masalah: MasalahBaris[] }) {
  if (masalah.length === 0) return null;
  return (
    <div data-masalah>
      <Typography.Text strong type="danger">
        {masalah.length} sel bermasalah (barisnya tidak disimpan):
      </Typography.Text>
      <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
        {masalah.slice(0, 50).map((m, i) => (
          <li key={i}>
            Baris {m.baris}, kolom "{m.kolom}": {m.alasan}
            {m.nilai ? ` (isi: ${m.nilai})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormManual({ saluran }: { saluran: Saluran }) {
  const aksi = useAksi();
  const web = saluran.jenis === "web";
  const [kode, setKode] = useState("");
  const [tgl, setTgl] = useState(hariIni());
  const [harga, setHarga] = useState("");
  const [potongan, setPotongan] = useState("");
  const [cair, setCair] = useState("");
  const hitung = Number(bersihkanAngka(harga) || 0) - Number(bersihkanAngka(potongan) || 0);
  const kirim = () =>
    aksi.mutate(
      {
        path: "/pencairan/manual",
        body: {
          saluran_id: saluran.id, kode_pesanan: kode.trim(), tanggal_cair: tgl, harga_jual: bersihkanAngka(harga),
          potongan: bersihkanAngka(potongan) || "0", jumlah_cair: bersihkanAngka(cair) || null,
        },
      },
      {
        onSuccess: () => {
          setKode("");
          setHarga("");
          setPotongan("");
          setCair("");
        },
      },
    );
  return (
    <Formulir onKirim={kirim} disabled={aksi.isPending}>
      <Typography.Paragraph type="secondary">
        {saluran.nama} dicatat manual per order (bruto: harga jual dan potongan biaya terpisah). Masuk sebagai draf, lalu Kirim ke laporan. Bila nanti file penghasilan diimpor,
        order yang sudah dicatat manual dilewati.
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Field label="Saluran">
            <Input aria-label="Saluran manual" value={saluran.nama} disabled />
          </Field>
        </Col>
        <Col xs={24} md={8}>
          <Field label="Kode pesanan">
            <Input aria-label="Kode pesanan" required value={kode} onChange={(e) => setKode(e.target.value)} />
          </Field>
        </Col>
        <Col xs={24} md={8}>
          <Field label="Tanggal cair">
            <InputTanggal value={tgl} onChange={setTgl} />
          </Field>
        </Col>
        <Col xs={12} md={8}>
          <Field label="Harga jual (Rp)">
            <Input aria-label="Harga jual" inputMode="numeric" required value={harga} onChange={(e) => setHarga(e.target.value)} />
          </Field>
        </Col>
        <Col xs={12} md={8}>
          <Field label={web ? "Potongan iPaymu (Rp)" : "Potongan biaya (Rp)"} hint="Admin, layanan, ongkir, dll.">
            <Input aria-label="Potongan biaya" inputMode="numeric" value={potongan} onChange={(e) => setPotongan(e.target.value)} />
          </Field>
        </Col>
        <Col xs={24} md={8}>
          <Field label="Jumlah cair (Rp)" hint={`Kosong = harga jual − potongan (${rp(hitung)})`}>
            <Input aria-label="Jumlah cair" inputMode="numeric" value={cair} onChange={(e) => setCair(e.target.value)} />
          </Field>
        </Col>
      </Row>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={!kode.trim() || !bersihkanAngka(harga)}>
          Simpan pencairan
        </Button>
      </AksiForm>
    </Formulir>
  );
}

function Riwayat({ saluran }: { saluran: Saluran[] }) {
  const q = usePencairan();
  const aksi = useAksi();
  const { tanya } = useDialog();
  const [buka, setBuka] = useState<PencairanUnggahan | null>(null);
  const nama = new Map(saluran.map((s) => [s.id, s.nama]));

  async function batal(u: PencairanUnggahan) {
    const alasan = await tanya(`Batalkan pencairan "${u.nama_file}"?`, { label: "Semua barisnya ikut dibatalkan. Tulis alasannya.", min: 3, panjang: true, ok: "Batalkan" });
    if (alasan) aksi.mutate({ path: `/pencairan/${u.id}/batal`, body: { alasan } });
  }

  const kolom: TableColumnsType<PencairanUnggahan> = [
    { title: "Tanggal", dataIndex: "tanggal", render: (v: string) => tanggal(v) },
    { title: "Saluran", dataIndex: "saluran_id", render: (v: string) => nama.get(v) ?? "-" },
    {
      title: "File",
      dataIndex: "nama_file",
      render: (v: string, u) => (
        <>
          {v} {u.sumber_sistem === "manual" && <Lencana>Manual</Lencana>}
        </>
      ),
    },
    { title: "Baris", dataIndex: "jumlah_baris", align: "right" },
    { title: "Total cair", dataIndex: "total", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    {
      title: "Status",
      render: (_, u) =>
        u.dibatalkan ? <Lencana warna="merah">Dibatalkan</Lencana> : u.status_kirim === "terkirim" ? <Lencana warna="hijau">Terkirim</Lencana> : <Lencana warna="oranye">Draf</Lencana>,
    },
    {
      title: "",
      render: (_, u) => (
        <Flex gap="small">
          <TombolLink onClick={() => setBuka(u)}>Rincian</TombolLink>
          {!u.dibatalkan && u.status_kirim === "draf" && (
            <TombolLink bahaya disabled={aksi.isPending} onClick={() => void batal(u)}>
              Batalkan
            </TombolLink>
          )}
        </Flex>
      ),
    },
  ];
  return (
    <Card judul="Riwayat pencairan">
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada pencairan" />}
      <Typography.Text type="secondary">Pencairan yang sudah dikirim ke laporan hanya bisa dibatalkan setelah kirimannya dibatalkan.</Typography.Text>
      {buka && <Rincian u={buka} onTutup={() => setBuka(null)} />}
    </Card>
  );
}

function Rincian({ u, onTutup }: { u: PencairanUnggahan; onTutup: () => void }) {
  const q = useQuery({ queryKey: ["pencairan-detail", u.id], queryFn: () => api<PencairanUnggahan>(`/pencairan/${u.id}`) });
  const aksi = useAksi();
  const { tanya, message } = useDialog();
  const bisaHubung = !u.dibatalkan && u.status_kirim === "draf";

  async function hubungkan(b: PencairanBaris) {
    const no = await tanya(`Hubungkan "${b.kode_pesanan}" ke order`, { label: "Tulis nomor order yang belum cair di saluran ini.", min: 1, ok: "Hubungkan" });
    if (!no) return;
    const bc = await api<BelumCair>("/laporan/belum-cair");
    const order = bc.per_saluran.find((s) => s.saluran_id === u.saluran_id)?.order.find((o) => o.no_order.toLowerCase() === no.trim().toLowerCase());
    if (!order) {
      message.error(`Order ${no} tidak ditemukan di daftar belum cair saluran ini.`);
      return;
    }
    aksi.mutate({ path: `/pencairan/baris/${b.id}/hubungkan`, body: { order_id: order.order_id } });
  }

  const kolom: TableColumnsType<PencairanBaris> = [
    { title: "Kode pesanan", dataIndex: "kode_pesanan" },
    { title: "Cair", dataIndex: "jumlah_cair", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
    {
      title: "Status",
      render: (_, b) =>
        b.dibatalkan ? (
          <Lencana warna="merah">Batal</Lencana>
        ) : (
          <Lencana warna={WARNA_KELOMPOK[b.status_cocok]}>{b.status_cocok === "tidak_cocok" ? "Menunggu order" : LABEL_KELOMPOK[b.status_cocok]}</Lencana>
        ),
    },
    {
      title: "",
      render: (_, b) =>
        bisaHubung && !b.dibatalkan && b.status_cocok === "tidak_cocok" ? (
          <TombolLink disabled={aksi.isPending} onClick={() => void hubungkan(b)}>
            Hubungkan
          </TombolLink>
        ) : null,
    },
  ];
  return (
    <Dialog judul={`Rincian ${u.nama_file}`} onTutup={onTutup}>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data?.baris ?? []} rowKey="id" minLebar={420} kosong="Tidak ada baris" />}
    </Dialog>
  );
}
