import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Col, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { AksiForm, Angka, Button, Card, DataTabel, ErrorBox, Field, Formulir, Input, Lencana, Memuat, Select, Teks, TombolLink, useDialog } from "../../components/ui";
import { unggah } from "../../lib/api";
import { useAksi, useSaluran } from "../../lib/data";
import { rp, tanggal } from "../../lib/format";
import { formulir, LABEL_KOLOM, useFormatPenghasilan, WAJIB_KOLOM } from "../../lib/pencairan";
import type { BacaHeader, FormatPenghasilan, FormatPenghasilanIn, KolomPeta, KolomTujuan, UjiFormat } from "../../lib/types";

const KOSONG = (saluranId: string): FormatPenghasilanIn => ({
  saluran_id: saluranId,
  nama: "",
  jenis_file: "xlsx",
  nama_sheet: null,
  baris_header: 1,
  baris_data_mulai: null,
  format_tanggal: "dd/mm/yyyy",
  pemisah_desimal: ",",
  pemisah_ribuan: ".",
  aturan_tanda: "mutlak",
  aturan_jenis_baris: {},
  satuan_baris: "per_pesanan",
  aturan_abaikan: {},
  catatan: "",
  kolom: WAJIB_KOLOM.map((t) => ({ kolom_tujuan: t, kolom_sumber: "", operasi: "ambil", nama_rincian: null })),
});

const LABEL_STATUS = { draf: ["oranye", "Draf"], aktif: ["hijau", "Aktif"], arsip: ["abu", "Arsip"] } as const;

/**
 * Format file penghasilan per saluran (spesifikasi 10.3): pemetaan kolom file seller center ke kolom standar.
 * Versi aktif tidak bisa diubah; buat versi baru (draf), uji dengan file asli, lalu aktifkan. Khusus admin.
 */
export default function MasterFormatPenghasilan() {
  const saluranQ = useSaluran();
  const pilihan = (saluranQ.data ?? []).filter((s) => s.aktif && s.jenis === "marketplace");
  const [sid, setSid] = useState("");
  const saluranId = sid || pilihan[0]?.id || "";
  const q = useFormatPenghasilan(saluranId, Boolean(saluranId));
  const aksi = useAksi<FormatPenghasilan>();
  const { konfirmasi } = useDialog();
  const [edit, setEdit] = useState<{ id: string | null; isi: FormatPenghasilanIn } | null>(null);
  const [uji, setUji] = useState<FormatPenghasilan | null>(null);

  const ubah = (f: FormatPenghasilan) => {
    const { id, ...isi } = f;
    setEdit({ id, isi: { ...KOSONG(f.saluran_id), ...isi } });
  };

  async function aktifkan(f: FormatPenghasilan) {
    if (await konfirmasi(`Aktifkan "${f.nama}" versi ${f.versi}?`, { teks: "Versi aktif sebelumnya diarsipkan. Unggahan berikutnya memakai versi ini.", ok: "Aktifkan" }))
      aksi.mutate({ path: `/format-penghasilan/${f.id}/aktifkan` });
  }

  const kolom: TableColumnsType<FormatPenghasilan> = [
    { title: "Nama", dataIndex: "nama" },
    { title: "Versi", dataIndex: "versi", align: "right" },
    { title: "Status", dataIndex: "status", render: (s: FormatPenghasilan["status"]) => <Lencana warna={LABEL_STATUS[s][0]}>{LABEL_STATUS[s][1]}</Lencana> },
    {
      title: "Uji",
      render: (_, f) =>
        f.hasil_uji ? (
          <span>
            {f.lulus_uji ? <Lencana warna="hijau">Lulus</Lencana> : <Lencana warna="merah">Gagal</Lencana>} {f.hasil_uji.jumlah_sah} baris, {rp(f.hasil_uji.total_cair)}
          </span>
        ) : (
          <Typography.Text type="secondary">Belum diuji</Typography.Text>
        ),
    },
    { title: "Diaktifkan", dataIndex: "diaktifkan_pada", render: (v: string | null) => (v ? tanggal(v.slice(0, 10)) : "-") },
    {
      title: "",
      render: (_, f) => (
        <Flex gap="small" wrap>
          {f.status === "draf" && <TombolLink onClick={() => ubah(f)}>Ubah</TombolLink>}
          {f.status === "draf" && <TombolLink onClick={() => setUji(f)}>Uji file</TombolLink>}
          {f.status === "draf" && f.lulus_uji && (
            <TombolLink disabled={aksi.isPending} onClick={() => void aktifkan(f)}>
              Aktifkan
            </TombolLink>
          )}
          {f.status !== "draf" && (
            <TombolLink disabled={aksi.isPending} onClick={() => aksi.mutate({ path: `/format-penghasilan/${f.id}/versi-baru` }, { onSuccess: ubah })}>
              Buat versi baru
            </TombolLink>
          )}
        </Flex>
      ),
    },
  ];

  if (saluranQ.isLoading) return <Memuat />;
  const adaDraf = q.data?.some((f) => f.status === "draf");
  return (
    <>
      <Card
        judul="Format file penghasilan"
        sub="Cara membaca file pencairan dari seller center. Ubah di sini bila marketplace mengganti format filenya; tidak perlu mengubah program."
        aksi={
          <Flex gap="small" wrap>
            <Select aria-label="Saluran format" value={saluranId} onChange={(e) => setSid(e.target.value)}>
              {pilihan.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </Select>
            {!adaDraf && saluranId && (
              <Button variant="pinggir" onClick={() => setEdit({ id: null, isi: KOSONG(saluranId) })}>
                Format baru
              </Button>
            )}
          </Flex>
        }
      >
        <ErrorBox error={q.error ?? aksi.error} />
        {q.isLoading ? <Memuat /> : <DataTabel kolom={kolom} data={q.data ?? []} rowKey="id" minLebar={760} kosong="Belum ada format untuk saluran ini" />}
        {q.data
          ?.filter((f) => f.catatan && f.status !== "arsip")
          .map((f) => (
            <Typography.Paragraph key={f.id} type="secondary" style={{ marginTop: 8 }}>
              Catatan {f.nama} v{f.versi}: {f.catatan}
            </Typography.Paragraph>
          ))}
      </Card>
      {edit && <Editor key={edit.id ?? "baru"} id={edit.id} awal={edit.isi} onSelesai={() => setEdit(null)} />}
      {uji && <UjiFile key={uji.id} f={uji} onTutup={() => setUji(null)} />}
    </>
  );
}

function Editor({ id, awal, onSelesai }: { id: string | null; awal: FormatPenghasilanIn; onSelesai: () => void }) {
  const [isi, setIsi] = useState(awal);
  const [header, setHeader] = useState<BacaHeader | null>(null);
  const aksi = useAksi();
  const baca = useMutation({
    mutationFn: (f: File) => unggah<BacaHeader>("/format-penghasilan/baca-header", formulir({ file: f, nama_sheet: isi.nama_sheet, baris_header: String(isi.baris_header) })),
    onSuccess: (h) => {
      setHeader(h);
      setIsi((v) => ({
        ...v,
        nama_sheet: h.nama_sheet,
        baris_header: h.baris_header,
        // Isi kolom sumber yang masih kosong dengan saran nama kolom.
        kolom: v.kolom.map((k) => (k.kolom_sumber ? k : { ...k, kolom_sumber: h.saran[k.kolom_tujuan] ?? "" })),
      }));
    },
  });
  const set = <K extends keyof FormatPenghasilanIn>(k: K, v: FormatPenghasilanIn[K]) => setIsi((x) => ({ ...x, [k]: v }));
  const setKolom = (i: number, p: Partial<KolomPeta>) => set("kolom", isi.kolom.map((k, j) => (j === i ? { ...k, ...p } : k)));
  const jenis = isi.aturan_jenis_baris;
  const kurang = WAJIB_KOLOM.filter((t) => !isi.kolom.some((k) => k.kolom_tujuan === t && k.kolom_sumber.trim()));

  const simpan = () => {
    const body = { ...isi, kolom: isi.kolom.filter((k) => k.kolom_sumber.trim()).map((k) => ({ ...k, kolom_sumber: k.kolom_sumber.trim(), nama_rincian: k.nama_rincian || null })) };
    aksi.mutate({ path: id ? `/format-penghasilan/${id}` : "/format-penghasilan", method: id ? "PUT" : "POST", body }, { onSuccess: onSelesai });
  };

  return (
    <Card judul={id ? "Ubah draf format" : "Format baru"} sub="Unggah contoh file untuk membaca nama kolomnya, lalu cocokkan ke kolom standar.">
      <Flex gap="small" align="center" wrap style={{ marginBottom: 16 }}>
        <input type="file" aria-label="Contoh file" accept=".xlsx,.csv" onChange={(e) => e.target.files?.[0] && baca.mutate(e.target.files[0])} />
        {baca.isPending && <Typography.Text type="secondary">Membaca…</Typography.Text>}
        {header && <Typography.Text type="secondary">{header.kolom.length} kolom terbaca di baris {header.baris_header}.</Typography.Text>}
      </Flex>
      <ErrorBox error={baca.error} />
      <Formulir onKirim={simpan} disabled={aksi.isPending}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Field label="Nama format">
              <Input aria-label="Nama format" required value={isi.nama} onChange={(e) => set("nama", e.target.value)} />
            </Field>
          </Col>
          <Col xs={12} md={4}>
            <Field label="Jenis file">
              <Select aria-label="Jenis file" value={isi.jenis_file} onChange={(e) => set("jenis_file", e.target.value as "xlsx" | "csv")}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </Select>
            </Field>
          </Col>
          <Col xs={12} md={4}>
            <Field label="Sheet">
              {header && header.sheets.length > 1 ? (
                <Select aria-label="Sheet" value={isi.nama_sheet ?? ""} onChange={(e) => set("nama_sheet", e.target.value || null)}>
                  {header.sheets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input aria-label="Sheet" value={isi.nama_sheet ?? ""} placeholder="Sheet pertama" onChange={(e) => set("nama_sheet", e.target.value || null)} />
              )}
            </Field>
          </Col>
          <Col xs={12} md={4}>
            <Field label="Baris judul kolom">
              <Input aria-label="Baris judul kolom" inputMode="numeric" value={String(isi.baris_header)} onChange={(e) => set("baris_header", Math.max(1, Number(e.target.value) || 1))} />
            </Field>
          </Col>
          <Col xs={12} md={4}>
            <Field label="Format tanggal">
              <Select aria-label="Format tanggal" value={isi.format_tanggal} onChange={(e) => set("format_tanggal", e.target.value)}>
                {["dd/mm/yyyy", "yyyy-mm-dd", "dd-mm-yyyy", "mm/dd/yyyy", "dd/mm/yyyy hh:mm", "yyyy-mm-dd hh:mm"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Angka">
              <Select
                aria-label="Format angka"
                value={`${isi.pemisah_ribuan}|${isi.pemisah_desimal}`}
                onChange={(e) => {
                  const [r, d] = e.target.value.split("|");
                  setIsi((x) => ({ ...x, pemisah_ribuan: r as FormatPenghasilanIn["pemisah_ribuan"], pemisah_desimal: d as FormatPenghasilanIn["pemisah_desimal"] }));
                }}
              >
                <option value=".|,">1.234,56 (Indonesia)</option>
                <option value=",|.">1,234.56 (Inggris)</option>
                <option value="|.">1234.56 (tanpa pemisah)</option>
              </Select>
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Tanda potongan">
              <Select aria-label="Tanda potongan" value={isi.aturan_tanda} onChange={(e) => set("aturan_tanda", e.target.value as FormatPenghasilanIn["aturan_tanda"])}>
                <option value="mutlak">Negatif atau positif sama saja</option>
                <option value="positif">Ditulis positif</option>
                <option value="kurung">Negatif dalam kurung (1.000)</option>
              </Select>
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Satu baris berisi">
              <Select aria-label="Satuan baris" value={isi.satuan_baris} onChange={(e) => set("satuan_baris", e.target.value as FormatPenghasilanIn["satuan_baris"])}>
                <option value="per_pesanan">Satu pesanan</option>
                <option value="per_produk">Satu produk (digabung per pesanan)</option>
              </Select>
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Kolom jenis baris" hint="Opsional, untuk mengenali retur & penyesuaian">
              <Input aria-label="Kolom jenis baris" value={jenis.kolom ?? ""} onChange={(e) => set("aturan_jenis_baris", { ...jenis, kolom: e.target.value || null })} />
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Kata penanda retur" hint="Pisahkan dengan koma">
              <Input aria-label="Kata penanda retur" value={(jenis.retur ?? []).join(", ")} onChange={(e) => set("aturan_jenis_baris", { ...jenis, retur: daftarKata(e.target.value) })} />
            </Field>
          </Col>
          <Col xs={12} md={6}>
            <Field label="Kata penanda penyesuaian" hint="Pisahkan dengan koma">
              <Input
                aria-label="Kata penanda penyesuaian"
                value={(jenis.penyesuaian ?? []).join(", ")}
                onChange={(e) => set("aturan_jenis_baris", { ...jenis, penyesuaian: daftarKata(e.target.value) })}
              />
            </Field>
          </Col>
        </Row>
        <Typography.Text strong>Pemetaan kolom</Typography.Text>
        <Typography.Paragraph type="secondary">
          Wajib: kode pesanan, tanggal cair, jumlah cair. Potongan boleh beberapa kolom (operasi "jumlahkan", beri nama rincian). Tanpa harga jual, penjualan dicatat neto.
        </Typography.Paragraph>
        {isi.kolom.map((k, i) => (
          <Row gutter={8} key={i} align="middle" data-peta>
            <Col xs={12} md={5}>
              <Select aria-label={`Kolom standar ${i + 1}`} value={k.kolom_tujuan} onChange={(e) => setKolom(i, { kolom_tujuan: e.target.value as KolomTujuan })}>
                {(Object.keys(LABEL_KOLOM) as KolomTujuan[]).map((t) => (
                  <option key={t} value={t}>
                    {LABEL_KOLOM[t]}
                  </option>
                ))}
              </Select>
            </Col>
            <Col xs={12} md={8}>
              {header ? (
                <Select aria-label={`Kolom file ${i + 1}`} value={k.kolom_sumber} placeholder="Pilih kolom file" onChange={(e) => setKolom(i, { kolom_sumber: e.target.value })}>
                  {[...new Set([...(k.kolom_sumber && !header.kolom.includes(k.kolom_sumber) ? [k.kolom_sumber] : []), ...header.kolom])].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input aria-label={`Kolom file ${i + 1}`} value={k.kolom_sumber} placeholder="Nama kolom di file" onChange={(e) => setKolom(i, { kolom_sumber: e.target.value })} />
              )}
            </Col>
            <Col xs={8} md={4}>
              <Select aria-label={`Operasi ${i + 1}`} value={k.operasi} onChange={(e) => setKolom(i, { operasi: e.target.value as KolomPeta["operasi"] })}>
                <option value="ambil">Ambil</option>
                <option value="jumlahkan">Jumlahkan</option>
                <option value="mutlak">Nilai mutlak</option>
                <option value="balik_tanda">Balik tanda</option>
              </Select>
            </Col>
            <Col xs={12} md={5}>
              {k.kolom_tujuan === "potongan_biaya" && (
                <Input aria-label={`Nama rincian ${i + 1}`} value={k.nama_rincian ?? ""} placeholder="Nama rincian (mis. Biaya admin)" onChange={(e) => setKolom(i, { nama_rincian: e.target.value })} />
              )}
            </Col>
            <Col xs={4} md={2}>
              <TombolLink bahaya onClick={() => set("kolom", isi.kolom.filter((_, j) => j !== i))}>
                Hapus
              </TombolLink>
            </Col>
          </Row>
        ))}
        <div style={{ margin: "8px 0 16px" }}>
          <Button variant="pinggir" kecil onClick={() => set("kolom", [...isi.kolom, { kolom_tujuan: "potongan_biaya", kolom_sumber: "", operasi: "jumlahkan", nama_rincian: "" }])}>
            Tambah kolom
          </Button>
        </div>
        <Field label="Catatan">
          <Teks aria-label="Catatan format" value={isi.catatan} onChange={(e) => set("catatan", e.target.value)} />
        </Field>
        <AksiForm error={aksi.error}>
          {kurang.length > 0 && <Typography.Text type="warning">Belum dipetakan: {kurang.map((t) => LABEL_KOLOM[t]).join(", ")}.</Typography.Text>}
          <Flex gap="small">
            <Button type="submit" disabled={kurang.length > 0 || isi.nama.trim().length < 2}>
              Simpan draf
            </Button>
            <Button variant="pinggir" onClick={onSelesai}>
              Batal
            </Button>
          </Flex>
        </AksiForm>
      </Formulir>
    </Card>
  );
}

const daftarKata = (t: string) =>
  t
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function UjiFile({ f, onTutup }: { f: FormatPenghasilan; onTutup: () => void }) {
  const qc = useQueryClient();
  const uji = useMutation({
    mutationFn: (file: File) => unggah<UjiFormat>(`/format-penghasilan/${f.id}/uji`, formulir({ file })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["format-penghasilan"] }),
  });
  const h = uji.data;
  return (
    <Card judul={`Uji ${f.nama} versi ${f.versi}`} sub="Unggah file asli dari seller center. Format bisa diaktifkan setelah lulus uji." aksi={<Button variant="pinggir" kecil onClick={onTutup}>Tutup</Button>}>
      <input type="file" aria-label="File uji" accept=".xlsx,.csv" onChange={(e) => e.target.files?.[0] && uji.mutate(e.target.files[0])} />
      <ErrorBox error={uji.error} />
      {uji.isPending && <Memuat />}
      {h && (
        <Flex vertical gap="small" style={{ marginTop: 12 }} data-hasil-uji>
          <Typography.Text strong type={h.lulus ? "success" : "danger"}>
            {h.lulus ? "Lulus" : "Gagal"}: {h.jumlah_sah} baris sah, {h.jumlah_masalah} masalah, total cair <Angka>{rp(h.total_cair)}</Angka>
            {h.neto ? " (neto: tanpa harga jual)" : ""}
          </Typography.Text>
          {h.masalah.slice(0, 20).map((m, i) => (
            <Typography.Text key={i} type="danger">
              Baris {m.baris}, kolom "{m.kolom}": {m.alasan}
            </Typography.Text>
          ))}
          <Typography.Text type="secondary">Cocokkan beberapa baris dengan seller center: {h.baris.slice(0, 3).map((b) => `${b.kode_pesanan} = ${rp(b.jumlah_cair)}`).join("; ")}.</Typography.Text>
        </Flex>
      )}
    </Card>
  );
}
