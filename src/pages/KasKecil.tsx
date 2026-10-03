import { useQuery } from "@tanstack/react-query";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Alert, Col, Flex, Row, Typography } from "antd";
import { Link } from "react-router-dom";
import DaftarTransaksi from "../components/DaftarTransaksi";
import DaftarTalangan from "../components/DaftarTalangan";
import UbahPlafon from "../components/UbahPlafon";
import FormTransaksi from "../components/FormTransaksi";
import KirimKeLaporan from "../components/KirimKeLaporan";
import { PanduanStaf, usePanduanStaf } from "../components/PanduanStaf";
import { Angka, Button, Card, ErrorBox, Kosong, Memuat, PageHeader, Progress, TombolLink, useDialog } from "../components/ui";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { api, query } from "../lib/api";
import { useAksi } from "../lib/data";
import { hariIni, num, rp } from "../lib/format";
import { saldoRendah } from "../lib/kas";
import type { AkunKas, Kategori, Transaksi } from "../lib/types";

/**
 * Kas kecil. Staf: tampilan sederhana (saldo besar, catat pengeluaran dengan 4 tombol kategori, 10 catatan terakhir,
 * tanpa tombol batal). Admin/owner: sama, ditambah riwayat lengkap dan pembatalan transaksi manual.
 */
export default function KasKecil() {
  const { user } = useAuth();
  const pemilik = isPemilik(user?.role);
  const panduan = usePanduanStaf(user?.id, !pemilik);
  const aksi = useAksi();
  const { tanya } = useDialog();
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const kas = akunQ.data?.find((a) => a.jenis === "kas_kecil");
  const trxQ = useQuery({
    queryKey: ["transaksi", kas?.id, "draf"],
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: kas?.id, termasuk_draf: "true" })}`),
    enabled: !!kas,
  });

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  if (!kas)
    return (
      <>
        <PageHeader judul="Kas kecil" />
        <Card>
          <Kosong teks="Kas kecil belum siap dipakai. Hubungi admin." />
          {pemilik && (
            <Typography.Paragraph type="secondary" style={{ textAlign: "center", marginBottom: 0 }}>
              Untuk admin: akun kas kecil belum ada di Data master (biasanya dibuat saat penyiapan data awal backend).
            </Typography.Paragraph>
          )}
        </Card>
      </>
    );

  // Uang fisik di tangan staf = saldo setelah draf; saldo resmi (laporan) baru berkurang setelah dikirim.
  const saldo = num(kas.saldo_setelah_draf ?? kas.saldo);
  const selisihDraf = num(kas.saldo) - saldo;
  const plafon = num(kas.plafon);
  const rendah = saldoRendah(saldo, plafon);
  const terbaru = (trxQ.data ?? []).slice(0, 10);

  // AB-TL-3: isi ulang di luar jadwal Selasa, wajib alasan; transfer bertanda "di luar jadwal".
  async function isiLuarJadwal() {
    const alasan = await tanya(`Isi kas kecil ${rp(plafon - saldo)} di luar jadwal?`, {
      label: "Dari Kas utama sampai plafon. Tulis alasan kenapa tidak menunggu Tutup Kas Mingguan.",
      min: 3,
      panjang: true,
      ok: "Isi sekarang",
    });
    if (alasan) aksi.mutate({ path: `/kas-kecil/pengisian${query({ tanggal: hariIni(), di_luar_jadwal: "true", alasan })}` });
  }

  const kartuSaldo = (
    <Card>
      <Typography.Text type="secondary">Sisa uang kas kecil</Typography.Text>
      <div style={{ fontSize: "clamp(34px, 7vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "4px 0 10px" }}>
        <Angka>{rp(saldo)}</Angka>
      </div>
      <Progress nilai={saldo} maks={plafon} />
      <Typography.Text type="secondary">
        Plafon {rp(plafon)} · diisi lagi sampai plafon setiap hari Selasa.
      </Typography.Text>
      {pemilik && selisihDraf !== 0 && (
        <Typography.Paragraph type="secondary" style={{ margin: "6px 0 0" }}>
          Saldo tercatat di laporan {rp(kas.saldo)} · draf belum dikirim {rp(selisihDraf)}
        </Typography.Paragraph>
      )}
      {rendah && (
        <Alert
          style={{ marginTop: 12 }}
          type="warning"
          showIcon
          title={pemilik ? "Saldo kas kecil di bawah 20% plafon. Isi ulang di Tutup Kas Mingguan." : "Uang kas kecil tinggal sedikit. Kabari admin."}
        />
      )}
      {pemilik && (
        <div style={{ marginTop: 8 }}>
          <UbahPlafon akun={kas} />
        </div>
      )}
      {pemilik && saldo < plafon && (
        <div style={{ marginTop: 8 }}>
          <TombolLink disabled={aksi.isPending} onClick={() => void isiLuarJadwal()}>
            Isi ulang di luar jadwal
          </TombolLink>
          <ErrorBox error={aksi.error} />
        </div>
      )}
    </Card>
  );
  const kartuCatat = (
    <Card judul="Catat pengeluaran">
      <FormTransaksi akun={[kas]} kategori={katQ.data ?? []} jenisTetap="keluar" akunAwal={kas.id} staf={!pemilik} tombolKategori />
    </Card>
  );

  if (!pemilik) {
    return (
      <>
        <PageHeader
          judul="Kas kecil"
          sub="Catat setiap uang kas kecil yang kamu pakai."
          aksi={
            <Button variant="pinggir" kecil onClick={panduan.tampilkan}>
              <QuestionCircleOutlined /> Panduan
            </Button>
          }
        />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Flex vertical gap="middle">
              {kartuSaldo}
              {kartuCatat}
            </Flex>
          </Col>
          <Col xs={24} lg={14}>
            <Card judul="10 catatan terakhir" aksi={<Link to="/laporan/kas-kecil">Riwayat bulan ini →</Link>}>
              <Typography.Paragraph type="secondary">Salah catat? Minta admin membatalkan, lalu catat ulang yang benar.</Typography.Paragraph>
              <DaftarTransaksi
                data={terbaru}
                kategori={katQ.data ?? []}
                bolehBatal={false}
                staf
                memuat={trxQ.isLoading}
                kosong="Belum ada catatan. Setelah memakai uang kas kecil, catat di 'Catat pengeluaran'."
              />
            </Card>
          </Col>
        </Row>
        <PanduanStaf buka={panduan.buka} onTutup={panduan.tutup} />
      </>
    );
  }

  return (
    <>
      <PageHeader judul="Kas kecil" sub="Pegangan staf, diisi kembali sampai plafon saat Tutup Kas Mingguan (biasanya tiap Selasa)" />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Flex vertical gap="middle">
            {kartuSaldo}
            {kartuCatat}
          </Flex>
        </Col>
        <Col xs={24} lg={16}>
          <Card judul="Talangan" sub="Uang pribadi yang dipakai saat kas kecil/kas iklan kurang; dilunasi dari Kas utama.">
            <DaftarTalangan riwayat />
          </Card>
          <div style={{ height: 16 }} />
          <Card judul="Riwayat" aksi={<Link to="/laporan/kas-kecil">Laporan bulanan</Link>}>
            <div style={{ marginBottom: 12 }}>
              <KirimKeLaporan sumber="kas_kecil" />
            </div>
            <DaftarTransaksi
              data={trxQ.data}
              kategori={katQ.data ?? []}
              bolehBatal
              memuat={trxQ.isLoading}
              kosong="Belum ada pengeluaran kas kecil."
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
