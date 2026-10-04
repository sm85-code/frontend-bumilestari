import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { Alert, Col, Divider, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Angka, Baris, Button, Card, DataTabel, ErrorBox, Field, InputTanggal, Lencana, Memuat, PageHeader, TombolLink, useDialog } from "../components/ui";
import { useAksi } from "../lib/data";
import { bulanTahun, hariIni, num, rp } from "../lib/format";
import { waktu } from "../lib/kiriman";
import { periodeSebelum } from "../lib/tugas";
import { penghalang, useDaftarTutupBuku, useKesiapan } from "../lib/tutupBuku";
import type { ButirKesiapan, TutupBuku } from "../lib/types";

/** Tanda tiap butir: hijau = siap, merah = penghalang belum siap, biru = catatan. */
function Tanda({ b }: { b: ButirKesiapan }) {
  if (b.siap) return <CheckCircleFilled style={{ color: "var(--ant-color-success)" }} aria-label="siap" />;
  if (b.penghalang) return <CloseCircleFilled style={{ color: "var(--ant-color-error)" }} aria-label="belum" />;
  return <InfoCircleFilled style={{ color: "var(--ant-color-info)" }} aria-label="catatan" />;
}

/**
 * Laporan > Tutup buku (spesifikasi 8.10). Admin menutup bulan setelah semua butir penghalang siap; bulan terkunci
 * dan angkanya disimpan sebagai snapshot. Buka darurat hanya admin, wajib alasan, dan hanya bila bagi hasil bulan itu
 * belum dibayar. Owner bisa melihat.
 */
export default function TutupBukuPage() {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const [periode, setPeriode] = useState(() => periodeSebelum(hariIni()));
  const k = useKesiapan(periode);
  const daftar = useDaftarTutupBuku();
  const aksi = useAksi<TutupBuku>();
  const { konfirmasi, tanya, message } = useDialog();
  const d = k.data;
  const kurang = penghalang(d);
  const nama = bulanTahun(periode);
  const baris = daftar.data?.find((t) => t.periode === periode);

  async function tutup() {
    if (!d) return;
    const ok = await konfirmasi(`Tutup buku ${nama}?`, {
      teks: `Laba bersih ${rp(d.pratinjau.laba_bersih)} dikunci. Setelah ditutup tidak ada catatan, transfer, atau pembatalan bertanggal ${nama}; koreksi dicatat di bulan berjalan.`,
      ok: `Tutup buku ${nama}`,
    });
    if (ok) aksi.mutate({ path: `/tutup-buku/${periode}` }, { onSuccess: () => void message.success(`${nama} sudah tutup buku.`) });
  }

  async function buka() {
    const alasan = await tanya(`Buka darurat ${nama}?`, {
      label: "Hanya bila ada kesalahan besar. Bagi hasil bulan ini belum boleh dibayar. Tulis alasannya (tercatat di log).",
      min: 3,
      panjang: true,
      ok: "Buka darurat",
    });
    if (alasan) aksi.mutate({ path: `/tutup-buku/${periode}/buka`, body: { alasan } });
  }

  const kolom: TableColumnsType<TutupBuku> = [
    { title: "Bulan", dataIndex: "periode", render: (v: string) => <TombolLink onClick={() => setPeriode(v)}>{bulanTahun(v)}</TombolLink> },
    { title: "Laba bersih terkunci", dataIndex: "laba_bersih", align: "right", render: (v: string | null) => <Angka>{rp(v)}</Angka> },
    { title: "Ditutup", dataIndex: "ditutup_pada", render: (v: string) => waktu(v) },
    {
      title: "Status",
      render: (_, t) =>
        t.status === "ditutup" ? (
          <Lencana warna="hijau">ditutup</Lencana>
        ) : (
          <Flex vertical>
            <Lencana warna="oranye">dibuka darurat</Lencana>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {waktu(t.dibuka_pada)} · {t.alasan_buka}
            </Typography.Text>
          </Flex>
        ),
    },
  ];

  return (
    <>
      <PageHeader judul="Tutup buku" sub="Kunci angka bulan lalu setelah semua beres; bagi hasil dihitung dari laba yang dikunci" />
      <Card>
        <Row>
          <Col xs={24} md={8}>
            <Field label="Bulan">
              <InputTanggal bulan value={periode} onChange={setPeriode} />
            </Field>
          </Col>
        </Row>
      </Card>
      <ErrorBox error={k.error ?? aksi.error} />
      {k.isLoading && <Memuat />}
      {d && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card judul={`Daftar kesiapan ${nama}`}>
              {d.status === "ditutup" && (
                <Alert type="success" showIcon style={{ marginBottom: 12 }} title={`${nama} sudah tutup buku${baris ? ` (${waktu(baris.ditutup_pada)})` : ""}. Angka bulan ini terkunci.`} />
              )}
              {d.status === "dibuka" && <Alert type="warning" showIcon style={{ marginBottom: 12 }} title={`${nama} sedang dibuka darurat: ${baris?.alasan_buka ?? ""}. Tutup lagi setelah koreksi.`} />}
              <Flex vertical gap={10}>
                {d.butir.map((b) => (
                  <Flex key={b.kode} gap="small" align="flex-start" data-butir={b.kode}>
                    <span style={{ paddingTop: 2 }}>
                      <Tanda b={b} />
                    </span>
                    <div>
                      <Typography.Text strong={b.penghalang && !b.siap}>{b.label}</Typography.Text>
                      {!b.penghalang && <Typography.Text type="secondary"> (catatan)</Typography.Text>}
                      {b.keterangan && (
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                            {b.keterangan}
                          </Typography.Text>
                        </div>
                      )}
                    </div>
                  </Flex>
                ))}
                <Typography.Text type="secondary">
                  Belum cair (catatan, tidak menghalangi): <b>{rp(d.belum_cair)}</b>
                </Typography.Text>
              </Flex>
              {kurang.some((b) => b.kode === "draf") && (
                <Typography.Paragraph style={{ marginTop: 12 }}>
                  <Link to="/kiriman">Kirim draf ke laporan keuangan →</Link>
                </Typography.Paragraph>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card judul={`Pratinjau laba rugi ${nama}`}>
              {d.pratinjau.pemasukan.map((b) => (
                <Baris key={`m-${b.kategori}`} kiri={b.kategori} kanan={rp(b.jumlah)} />
              ))}
              <Baris kiri="Total pemasukan" kanan={rp(d.pratinjau.total_pemasukan)} tebal />
              <Divider style={{ margin: "8px 0" }} />
              {d.pratinjau.biaya.map((b) => (
                <Baris key={`b-${b.kategori}`} kiri={b.kategori} kanan={rp(b.jumlah)} />
              ))}
              <Baris kiri="Total biaya" kanan={rp(d.pratinjau.total_biaya)} tebal />
              <Divider style={{ margin: "8px 0" }} />
              <Baris
                kiri="Laba bersih"
                kanan={<Typography.Text type={num(d.pratinjau.laba_bersih) < 0 ? "danger" : "success"}>{rp(d.pratinjau.laba_bersih)}</Typography.Text>}
                tebal
              />
              <Flex gap="small" wrap style={{ marginTop: 16 }}>
                {admin && d.status !== "ditutup" && (
                  <Button disabled={aksi.isPending || !d.boleh_tutup} onClick={() => void tutup()}>
                    Tutup buku {nama}
                  </Button>
                )}
                {admin && d.status === "ditutup" && (
                  <Button variant="bahaya" disabled={aksi.isPending} onClick={() => void buka()}>
                    Buka darurat
                  </Button>
                )}
                {d.status === "ditutup" && <Link to="/bagi-hasil">Hitung bagi hasil {nama} →</Link>}
              </Flex>
              {admin && d.status !== "ditutup" && !d.boleh_tutup && (
                <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
                  Selesaikan dulu: {kurang.map((b) => b.label.toLowerCase()).join("; ")}.
                </Typography.Paragraph>
              )}
              {!admin && <Typography.Paragraph type="secondary">Hanya admin yang bisa menutup atau membuka buku.</Typography.Paragraph>}
            </Card>
          </Col>
        </Row>
      )}
      <Card judul="Riwayat tutup buku">
        <DataTabel kolom={kolom} data={daftar.data ?? []} rowKey="id" minLebar={720} kosong="Belum ada bulan yang ditutup." />
      </Card>
    </>
  );
}
