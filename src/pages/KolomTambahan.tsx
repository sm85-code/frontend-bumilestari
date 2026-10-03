import { Checkbox, Col, Row, Space, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AksiForm, Button, Card, DataTabel, Dialog, ErrorBox, Field, Formulir, Input, Lencana, Memuat, PageHeader, Select, TombolLink, useDialog } from "../components/ui";
import { useAksi } from "../lib/data";
import { LABEL_ENTITAS, LABEL_TIPE, useDefinisiKolom } from "../lib/kolom";
import type { DefinisiKolom, EntitasKolom, TipeKolom } from "../lib/types";

const CENTANG = [
  ["wajib", "Wajib diisi"],
  ["tampil_form", "Tampil di form"],
  ["tampil_tabel", "Tampil di tabel"],
  ["bisa_filter", "Bisa difilter"],
  ["ikut_ekspor", "Ikut diekspor"],
  ["untuk_laporan", "Boleh untuk pengelompokan laporan"],
] as const;
type Centang = (typeof CENTANG)[number][0] | "tampil_staf";

function FormKolom({ entitas, awal, onSelesai }: { entitas: EntitasKolom; awal?: DefinisiKolom; onSelesai: () => void }) {
  const aksi = useAksi();
  const [label, setLabel] = useState(awal?.label ?? "");
  const [tipe, setTipe] = useState<TipeKolom>(awal?.tipe ?? "teks");
  const [pilihan, setPilihan] = useState((awal?.pilihan ?? []).filter((p) => !p.arsip).map((p) => p.nilai).join(", "));
  const [bawaan, setBawaan] = useState(awal?.nilai_bawaan ?? "");
  const [min, setMin] = useState(awal?.min ?? "");
  const [maks, setMaks] = useState(awal?.maks ?? "");
  const [cek, setCek] = useState<Record<Centang, boolean>>({
    wajib: awal?.wajib ?? false,
    tampil_form: awal?.tampil_form ?? true,
    tampil_tabel: awal?.tampil_tabel ?? false,
    bisa_filter: awal?.bisa_filter ?? false,
    ikut_ekspor: awal?.ikut_ekspor ?? true,
    untuk_laporan: awal?.untuk_laporan ?? false,
    tampil_staf: awal?.tampil_staf ?? false,
  });
  const terkunci = (awal?.terisi ?? 0) > 0; // AB-DM-2
  const daftarCentang: (readonly [Centang, string])[] = [...CENTANG, ...(entitas === "transaksi" ? ([["tampil_staf", "Tampil untuk staf (form Kas kecil)"]] as const) : [])];
  return (
    <Formulir
      onKirim={() => {
        const body = {
          label: label.trim(),
          tipe,
          pilihan: tipe === "pilihan" ? pilihan.split(",").map((p) => p.trim()).filter(Boolean) : [],
          nilai_bawaan: bawaan.trim() || null,
          min: min.trim() || null,
          maks: maks.trim() || null,
          ...cek,
          tampil_staf: entitas === "transaksi" && cek.tampil_staf,
        };
        aksi.mutate(awal?.id ? { path: `/definisi-kolom/${awal.id}`, method: "PATCH", body } : { path: "/definisi-kolom", body: { ...body, entitas } }, { onSuccess: onSelesai });
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Field label="Label kolom">
            <Input aria-label="Label kolom" required value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
        </Col>
        <Col xs={24} md={12}>
          <Field label="Jenis data" hint={terkunci ? "Tidak bisa diubah karena sudah berisi data" : undefined}>
            <Select aria-label="Jenis data" disabled={terkunci} value={tipe} onChange={(e) => setTipe(e.target.value as TipeKolom)}>
              {Object.entries(LABEL_TIPE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </Col>
        {tipe === "pilihan" && (
          <Col xs={24}>
            <Field label="Daftar pilihan" hint="Pisahkan dengan koma. Pilihan yang sudah dipakai dan dihapus akan diarsipkan.">
              <Input aria-label="Daftar pilihan" required value={pilihan} onChange={(e) => setPilihan(e.target.value)} />
            </Field>
          </Col>
        )}
        <Col xs={24} md={8}>
          <Field label="Nilai bawaan">
            <Input aria-label="Nilai bawaan" value={bawaan} onChange={(e) => setBawaan(e.target.value)} />
          </Field>
        </Col>
        {(tipe === "angka" || tipe === "mata_uang") && (
          <>
            <Col xs={12} md={8}>
              <Field label="Minimum">
                <Input aria-label="Minimum" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
              </Field>
            </Col>
            <Col xs={12} md={8}>
              <Field label="Maksimum">
                <Input aria-label="Maksimum" inputMode="decimal" value={maks} onChange={(e) => setMaks(e.target.value)} />
              </Field>
            </Col>
          </>
        )}
      </Row>
      <Space wrap style={{ marginBottom: 16 }}>
        {daftarCentang.map(([k, teks]) => (
          <Checkbox key={k} checked={cek[k]} onChange={(e) => setCek({ ...cek, [k]: e.target.checked })}>
            {teks}
          </Checkbox>
        ))}
      </Space>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending} penuh>
          Simpan kolom
        </Button>
      </AksiForm>
    </Formulir>
  );
}

/** Data master → kolom tambahan & label kolom inti (spesifikasi 10.4, khusus Admin). */
export default function KolomTambahanPage() {
  const [entitas, setEntitas] = useState<EntitasKolom>("order");
  const [form, setForm] = useState<DefinisiKolom | "baru" | null>(null);
  const q = useDefinisiKolom(entitas);
  const aksi = useAksi();
  const { konfirmasi, tanya } = useDialog();
  const inti = (q.data ?? []).filter((d) => d.lapisan === "inti");
  const tambahan = (q.data ?? []).filter((d) => d.lapisan === "tambahan");
  const aktif = tambahan.filter((d) => d.aktif).length;

  const gantiLabel = async (d: DefinisiKolom) => {
    const label = await tanya(`Label untuk "${d.label_bawaan}"`, { label: "Label baru", awal: d.label, ok: "Simpan" });
    if (label) aksi.mutate({ path: `/definisi-kolom/inti/${entitas}/${d.kunci}`, method: "PATCH", body: { label } });
  };
  const kolomInti: TableColumnsType<DefinisiKolom> = [
    { title: "Kolom", dataIndex: "label_bawaan" },
    { title: "Label tampil", dataIndex: "label", render: (v: string, d) => (d.id ? <Lencana warna="hijau">{v}</Lencana> : v) },
    { title: "Wajib", dataIndex: "wajib", render: (v: boolean) => (v ? "Ya" : "—") },
    {
      title: "",
      key: "aksi",
      render: (_: unknown, d) => (
        <Space>
          <TombolLink onClick={() => void gantiLabel(d)}>Ganti label</TombolLink>
          {d.id && <TombolLink onClick={() => aksi.mutate({ path: `/definisi-kolom/inti/${entitas}/${d.kunci}/reset-label` })}>Kembalikan label bawaan</TombolLink>}
        </Space>
      ),
    },
  ];
  const kolomTambahan: TableColumnsType<DefinisiKolom> = [
    { title: "Label", dataIndex: "label", fixed: "left", width: 170 },
    { title: "Jenis", dataIndex: "tipe", render: (v: TipeKolom) => LABEL_TIPE[v] },
    { title: "Wajib", dataIndex: "wajib", render: (v: boolean) => (v ? "Ya" : "—") },
    { title: "Di tabel", dataIndex: "tampil_tabel", render: (v: boolean) => (v ? "Ya" : "—") },
    ...(entitas === "transaksi" ? [{ title: "Staf", dataIndex: "tampil_staf", render: (v: boolean) => (v ? "Ya" : "—") }] : []),
    { title: "Terisi", dataIndex: "terisi", align: "right" as const },
    { title: "Status", dataIndex: "aktif", render: (v: boolean) => (v ? <Lencana warna="hijau">Aktif</Lencana> : <Lencana>Nonaktif</Lencana>) },
    {
      title: "",
      key: "aksi",
      render: (_: unknown, d) => (
        <Space>
          <TombolLink onClick={() => setForm(d)}>Ubah</TombolLink>
          {d.aktif ? (
            <TombolLink onClick={() => aksi.mutate({ path: `/definisi-kolom/${d.id}/nonaktif` })}>Nonaktifkan</TombolLink>
          ) : (
            <TombolLink onClick={() => aksi.mutate({ path: `/definisi-kolom/${d.id}`, method: "PATCH", body: { aktif: true } })}>Aktifkan</TombolLink>
          )}
          {!d.terisi && (
            <TombolLink
              bahaya
              onClick={() =>
                void konfirmasi(`Hapus kolom ${d.label}?`, { ok: "Hapus", bahaya: true }).then((ya) => ya && aksi.mutate({ path: `/definisi-kolom/${d.id}`, method: "DELETE" }))
              }
            >
              Hapus
            </TombolLink>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader judul="Kolom & label" sub="Kolom tambahan per data dan label kolom inti. Kolom tambahan tidak masuk rumus keuangan." aksi={<Link to="/master">← Data master</Link>} />
      <Card>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Field label="Data">
              <Select aria-label="Data" value={entitas} onChange={(e) => setEntitas(e.target.value as EntitasKolom)}>
                {Object.entries(LABEL_ENTITAS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={q.error ?? aksi.error} />
      {q.isLoading && <Memuat />}
      <Card
        judul={`Kolom tambahan ${LABEL_ENTITAS[entitas]} (${aktif}/20 aktif)`}
        aksi={
          <Button disabled={aktif >= 20} onClick={() => setForm("baru")}>
            Tambah kolom
          </Button>
        }
      >
        <div data-kolom-daftar>
          <DataTabel kolom={kolomTambahan} data={tambahan} rowKey="kunci" minLebar={760} />
        </div>
        <Typography.Paragraph type="secondary">Kolom yang sudah berisi data hanya bisa dinonaktifkan. Owner tidak melihat kolom tambahan.</Typography.Paragraph>
      </Card>
      <Card judul="Label kolom inti" sub="Fungsi dan aturan kolom inti tetap dari aplikasi. Dokumen resmi (invoice, rekap) selalu memakai label bawaan.">
        <DataTabel kolom={kolomInti} data={inti} rowKey="kunci" minLebar={560} />
      </Card>
      {form && (
        <Dialog judul={form === "baru" ? "Tambah kolom" : `Ubah kolom ${form.label}`} onTutup={() => setForm(null)}>
          <FormKolom entitas={entitas} awal={form === "baru" ? undefined : form} onSelesai={() => setForm(null)} />
        </Dialog>
      )}
    </>
  );
}
