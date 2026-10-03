import { useQuery } from "@tanstack/react-query";
import { AccountBookOutlined, BankOutlined, SafetyOutlined, ShopOutlined, SoundOutlined, WalletOutlined } from "@ant-design/icons";
import { CheckCircleFilled, RightOutlined } from "@ant-design/icons";
import { Col, Flex, Row, Tag, Typography } from "antd";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Angka, Baris, Button, Card, ErrorBox, Memuat, PageHeader, Progress, Stat, TautanBulat } from "../components/ui";
import { api, query } from "../lib/api";
import { bulanTahun, hariIni, num, rp, tanggal } from "../lib/format";
import { pisahKas, saldoRendah } from "../lib/kas";
import { ringkasDraf } from "../lib/kiriman";
import { awalBulan, daftarTugas, periodeSebelum } from "../lib/tugas";
import { useSelasa } from "../lib/useSelasa";
import type { AkunKas, Dashboard, Gaji, Imprest, Karyawan, Langganan, Tagihan } from "../lib/types";

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
  SALDO_TIKTOK: { warna: ["#5b5b66", "#25252b"], ikon: <ShopOutlined /> },
  SALDO_LAZADA: { warna: ["#6f7bf7", "#3b2fc9"], ikon: <ShopOutlined /> },
  SALDO_BLIBLI: { warna: ["#4aa3ff", "#0a62c9"], ikon: <ShopOutlined /> },
  SALDO_IPAYMU: { warna: ["#5cc6c0", "#2a8a85"], ikon: <WalletOutlined /> },
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
        {akun.plafon && <div style={{ fontSize: 12, opacity: 0.85 }}>plafon {rp(akun.plafon)}</div>}
      </div>
    </div>
  );
}

function KartuImprest({ judul, data, ke }: { judul: string; data: Imprest; ke?: string }) {
  const perlu = num(data.perlu_diisi);
  const rendah = saldoRendah(num(data.saldo), num(data.plafon));
  return (
    <Card judul={judul} sub={`plafon ${rp(data.plafon)}`} aksi={ke ? <TautanBulat ke={ke} /> : undefined}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>
        <Angka>{rp(data.saldo)}</Angka>
      </div>
      <Progress nilai={num(data.saldo)} maks={num(data.plafon)} />
      <Typography.Text type={perlu > 0 ? "warning" : "secondary"} strong={perlu > 0}>
        {perlu > 0 ? `Perlu diisi ${rp(perlu)} hari Selasa` : "Sudah penuh"}
      </Typography.Text>
      {rendah && (
        <div>
          <Typography.Text type="danger">Saldo di bawah 20% plafon.</Typography.Text>
        </div>
      )}
    </Card>
  );
}

const kunciCekFisik = (periode: string) => `bl-cek-fisik:${periode}`;

/** "Yang perlu dikerjakan": dirangkum dari endpoint yang sudah ada (tanpa endpoint baru). */
function YangPerluDikerjakan({ data, admin }: { data: Dashboard; admin: boolean }) {
  const hari = hariIni();
  const s = useSelasa(hari, admin);
  const lalu = periodeSebelum(hari);
  const awal = awalBulan(hari);
  const karyawanQ = useQuery({ queryKey: ["karyawan"], enabled: awal, queryFn: () => api<Karyawan[]>("/karyawan") });
  const gajiQ = useQuery({ queryKey: ["gaji", lalu], enabled: awal, queryFn: () => api<Gaji[]>(`/gaji${query({ periode: lalu })}`) });
  const langgananQ = useQuery({ queryKey: ["langganan"], enabled: awal, queryFn: () => api<Langganan[]>("/langganan") });
  const tagihanQ = useQuery({ queryKey: ["tagihan", lalu], enabled: awal, queryFn: () => api<Tagihan[]>(`/tagihan${query({ periode: lalu })}`) });
  const [cekFisik, setCekFisik] = useState(() => {
    try {
      return window.localStorage.getItem(kunciCekFisik(lalu)) === "1";
    } catch {
      return false;
    }
  });

  const adaKaryawan = (karyawanQ.data ?? []).some((k) => k.aktif && num(k.gaji_bulanan) > 0);
  const gajiBelum = gajiQ.data && karyawanQ.data ? adaKaryawan && (gajiQ.data.length === 0 || gajiQ.data.some((g) => !g.tanggal_bayar)) : undefined;
  const sudahTagihan = new Set((tagihanQ.data ?? []).filter((t) => !t.dibatalkan).map((t) => t.langganan_id));
  const tagihanBelum = langgananQ.data && tagihanQ.data ? langgananQ.data.filter((l) => l.aktif && num(l.jumlah_bulanan) > 0 && !sudahTagihan.has(l.id)).length : undefined;

  const tugas = daftarTugas({
    hariIni: hari,
    selasa: s.selasa,
    selasaBeres: s.beres,
    selasaTotal: s.total,
    utangTukang: num(s.siapQ.data?.total ?? data.utang_pemasok_siap_bayar),
    // Boleh beberapa pembayaran per minggu: "sudah" bila tidak ada lagi yang belum dibayar.
    tukangSudahDibayar: Boolean(s.siapQ.data && s.siapQ.data.pemasok.length === 0),
    tagihanPenjualLain: s.tagihanSelasaIni,
    jumlahInvoice: s.invoiceQ.data?.length ?? 0,
    kasKecil: data.kas_kecil,
    kasIklan: data.kas_iklan,
    periodeLalu: lalu,
    gajiBelumDibayar: gajiBelum,
    tagihanRutinBelum: tagihanBelum,
    cekFisikSelesai: cekFisik,
    draf: data.draf_belum_dikirim ? ringkasDraf(data.draf_belum_dikirim) : undefined,
  });

  const tandaiCekFisik = () => {
    try {
      window.localStorage.setItem(kunciCekFisik(lalu), "1");
    } catch {
      /* abaikan */
    }
    setCekFisik(true);
  };

  return (
    <Card judul="Yang perlu dikerjakan" sub={tugas.length ? `${tugas.length} hal` : undefined}>
      {tugas.length === 0 ? (
        <Flex align="center" gap="small">
          <CheckCircleFilled style={{ color: "var(--ant-color-success)", fontSize: 20 }} />
          <Typography.Text>Semua beres. Tidak ada yang perlu dikerjakan sekarang.</Typography.Text>
        </Flex>
      ) : (
        <Flex vertical>
          {tugas.map((t) => (
            <Flex key={t.id} data-tugas={t.id} justify="space-between" align="center" gap="small" style={{ padding: "10px 0", borderBottom: "1px solid var(--ant-color-split)" }}>
              <Link to={t.ke} style={{ flex: 1, color: "inherit" }}>
                <Typography.Text strong={t.penting} type={t.penting ? "warning" : undefined}>
                  {t.teks}
                </Typography.Text>
              </Link>
              {t.manual ? (
                <Button variant="pinggir" kecil onClick={tandaiCekFisik}>
                  Tandai selesai
                </Button>
              ) : (
                <Link to={t.ke} aria-label={`Buka: ${t.teks}`}>
                  <RightOutlined />
                </Link>
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </Card>
  );
}

export default function Beranda() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });
  const s = useSelasa(hariIni(), user?.role === "admin");

  if (isLoading) return <Memuat />;
  if (error || !data) return <ErrorBox error={error ?? new Error("Data tidak tersedia")} />;

  const laba = num(data.laba_bulan_ini);
  const status = Object.entries(data.order_per_status);
  const kas = pisahKas(data.total_kas, data.akun);
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
          <Stat hero label="Kas bisa dipakai" nilai={rp(kas.bisaDipakai)} sub={`Dana cadangan ${rp(kas.cadangan)} (untuk gaji)`} ke="/keuangan" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat label={`Laba ${bulanTahun(data.periode)}`} nilai={rp(data.laba_bulan_ini)} warna={laba < 0 ? "merah" : "hijau"} sub={`Masuk ${rp(data.pemasukan_bulan_ini)}`} ke="/laporan" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat label="Bayar tukang Selasa ini" nilai={rp(data.utang_pemasok_siap_bayar)} warna="oranye" ke="/pesanan-tukang" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Stat
            label="Tagihan penjual lain jatuh tempo Selasa ini"
            nilai={s.invoiceQ.data ? rp(s.tagihanSelasaIni) : "…"}
            warna={s.tagihanSelasaIni > 0 ? "oranye" : undefined}
            sub={`Semua belum dibayar ${rp(data.piutang_penjual_lain)}`}
            ke="/penjual-lain"
          />
        </Col>
      </Row>

      <YangPerluDikerjakan data={data} admin={user?.role === "admin"} />

      <Card judul="Akun kas" sub={`Total semua kas ${rp(data.total_kas)}, termasuk Dana cadangan`} aksi={<TautanBulat ke="/keuangan" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          {data.akun.map((a) => (
            <KartuAkun key={a.id} akun={a} />
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card judul="Order" aksi={<TautanBulat ke="/order" />}>
            <Typography.Paragraph style={{ marginBottom: 12 }}>
              Order bulan ini: <b style={{ fontSize: 22 }}>{data.order_bulan_ini}</b> · omzet <b>{rp(data.omzet_order_bulan_ini)}</b>
            </Typography.Paragraph>
            {status.length === 0 ? (
              <Typography.Text type="secondary">Belum ada order. Order baru dicatat di menu Order.</Typography.Text>
            ) : (
              <Flex wrap gap={6} align="center">
                <Typography.Text type="secondary" style={{ width: "100%" }}>
                  Status semua order (sepanjang waktu)
                </Typography.Text>
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
        <Card judul={`Pratinjau bagi hasil ${bulanTahun(data.periode)}`} sub="Dihitung dari laba bulan berjalan; angka final saat bagi hasil disimpan." aksi={<TautanBulat ke="/bagi-hasil" />}>
          <Baris kiri="Admin" kanan={rp(data.bagian_admin_pratinjau)} />
          <Baris kiri="Owner" kanan={rp(data.bagian_owner_pratinjau)} />
        </Card>
      )}
    </>
  );
}
