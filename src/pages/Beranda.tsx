import { useQuery } from "@tanstack/react-query";
import { AccountBookOutlined, BankOutlined, SafetyOutlined, ShopOutlined, SoundOutlined, WalletOutlined } from "@ant-design/icons";
import { Col, Flex, Row, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { Angka, Baris, Card, ErrorBox, Memuat, PageHeader, Progress, Stat, TautanBulat } from "../components/ui";
import { api } from "../lib/api";
import { num, rp, tanggal } from "../lib/format";
import type { AkunKas, Dashboard, Imprest } from "../lib/types";

const STATUS_LABEL: Record<string, string> = {
  dipesan: "Dipesan",
  dikerjakan: "Dikerjakan",
  diambil: "Diambil",
  diterima: "Diterima",
  dicat: "Dicat",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

/** Warna kartu akun diambil dari logo: hijau daun, oranye matahari, coklat gunung. */
const GAYA_AKUN: Record<string, { warna: [string, string]; ikon: ReactNode }> = {
  KAS_UTAMA: { warna: ["#4f8f2e", "#2b5418"], ikon: <BankOutlined /> },
  SALDO_SHOPEE: { warna: ["#ffbf3d", "#f27d1c"], ikon: <ShopOutlined /> },
  KAS_KECIL: { warna: ["#9a8f7c", "#655e54"], ikon: <AccountBookOutlined /> },
  DANA_CADANGAN: { warna: ["#79c27a", "#3a8a55"], ikon: <SafetyOutlined /> },
  KAS_IKLAN: { warna: ["#ffd75a", "#f2a30f"], ikon: <SoundOutlined /> },
};
const GAYA_LAIN = { warna: ["#8aa0b3", "#52687c"] as [string, string], ikon: <WalletOutlined /> };

function KartuAkun({ akun }: { akun: AkunKas }) {
  const g = GAYA_AKUN[akun.kode] ?? GAYA_LAIN;
  const [nama, sisa] = akun.nama.split(/\s*\(/);
  const rincian = sisa?.replace(/\)$/, "");
  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${g.warna[0]}, ${g.warna[1]})`,
        borderRadius: 24,
        padding: 16,
        minHeight: 140,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: `0 14px 28px -14px ${g.warna[1]}99`,
      }}
    >
      <Flex align="center" gap={10}>
        <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 14, background: "rgba(255,255,255,0.92)", color: g.warna[1], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {g.ikon}
        </span>
        <div style={{ minWidth: 0, lineHeight: 1.25 }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{nama}</div>
          {rincian && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{rincian}</div>}
        </div>
      </Flex>
      <div>
        <div style={{ fontSize: "clamp(17px, 2.4vw, 24px)", fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{rp(akun.saldo)}</div>
        {akun.plafon && <div style={{ fontSize: 12, opacity: 0.85 }}>jatah {rp(akun.plafon)}</div>}
      </div>
    </div>
  );
}

function KartuImprest({ judul, data, ke }: { judul: string; data: Imprest; ke?: string }) {
  const perlu = num(data.perlu_diisi);
  return (
    <Card judul={judul} sub={`jatah ${rp(data.plafon)}`} aksi={ke ? <TautanBulat ke={ke} /> : undefined}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
        <Angka>{rp(data.saldo)}</Angka>
      </div>
      <Progress nilai={num(data.saldo)} maks={num(data.plafon)} />
      <Typography.Text type={perlu > 0 ? "warning" : "secondary"} strong={perlu > 0}>
        {perlu > 0 ? `Perlu diisi ${rp(perlu)} hari Selasa` : "Sudah penuh"}
      </Typography.Text>
    </Card>
  );
}

export default function Beranda() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });

  if (isLoading) return <Memuat />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Data tidak tersedia")} />;

  const laba = num(data.laba_bulan_ini);
  const status = Object.entries(data.order_per_status);
  return (
    <>
      <PageHeader
        judul={
          <>
            Selamat datang, <span style={{ color: "#8b929a", fontWeight: 400 }}>{user?.nama}</span>
          </>
        }
        sub={`Selasa acuan ${tanggal(data.selasa)}`}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Stat hero label="Total kas" nilai={rp(data.total_kas)} ke="/keuangan" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat label={`Laba ${data.periode}`} nilai={rp(data.laba_bulan_ini)} warna={laba < 0 ? "merah" : "hijau"} sub={`Masuk ${rp(data.pemasukan_bulan_ini)}`} ke="/laporan" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat label="Bayar tukang Selasa ini" nilai={rp(data.utang_pemasok_siap_bayar)} warna="oranye" ke="/pesanan-tukang" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat label="Tagihan penjual lain" nilai={rp(data.piutang_penjual_lain)} sub="belum dibayar" ke="/penjual-lain" />
        </Col>
      </Row>

      <Card judul="Akun" sub="Saldo setiap akun kas" aksi={<TautanBulat ke="/keuangan" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          {data.akun.map((a) => (
            <KartuAkun key={a.id} akun={a} />
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card judul="Order" sub="Bulan ini" aksi={<TautanBulat ke="/order" />}>
            <Typography.Paragraph style={{ marginBottom: 12 }}>
              <b style={{ fontSize: 22 }}>{data.order_bulan_ini}</b> order · omzet <b>{rp(data.omzet_order_bulan_ini)}</b>
            </Typography.Paragraph>
            {status.length === 0 ? (
              <Typography.Text type="secondary">Belum ada order</Typography.Text>
            ) : (
              <Flex wrap gap={6}>
                {status.map(([s, n]) => (
                  <Tag key={s} color="success" variant="filled">
                    {STATUS_LABEL[s] ?? s}: <b>{n}</b>
                  </Tag>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Flex vertical gap={16}>
            {data.kas_kecil && <KartuImprest judul="Kas kecil" data={data.kas_kecil} ke="/kas-kecil" />}
            {data.kas_iklan && <KartuImprest judul="Kas iklan (admin)" data={data.kas_iklan} />}
          </Flex>
        </Col>
      </Row>

      {data.bagian_admin_pratinjau !== null && data.bagian_owner_pratinjau !== null && (
        <Card judul={`Pratinjau bagi hasil ${data.periode}`} sub="Dihitung dari laba bulan berjalan; angka final saat bagi hasil disimpan." aksi={<TautanBulat ke="/bagi-hasil" />}>
          <Baris kiri="Admin" kanan={rp(data.bagian_admin_pratinjau)} />
          <Baris kiri="Owner" kanan={rp(data.bagian_owner_pratinjau)} />
        </Card>
      )}
    </>
  );
}
