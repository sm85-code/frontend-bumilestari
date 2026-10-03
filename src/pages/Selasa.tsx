import { Alert, Col, Flex, Row, Steps, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Angka, BarisTotal, Button, Card, DataTabel, ErrorBox, Field, Input, InputTanggal, Kosong, Lencana, Memuat, PageHeader, Progress, Select, useDialog } from "../components/ui";
import { useAksi } from "../lib/data";
import { bersihkanAngka, hariIni, num, rp, tanggal, tanggalHari } from "../lib/format";
import { LANGKAH, LANGKAH_AKTIF, akunSaldoToko, selasaAcuan, type IdLangkah, type StatusLangkah } from "../lib/selasa";
import { useSelasa } from "../lib/useSelasa";
import type { Invoice, PengisianImprest, SiapBayar, Sisihan } from "../lib/types";

type DataSelasa = ReturnType<typeof useSelasa>;

const LABEL_STATUS: Record<StatusLangkah, ReactNode> = {
  selesai: <Lencana warna="hijau">Selesai</Lencana>,
  belum: <Lencana warna="oranye">Belum</Lencana>,
  dilewati: <Lencana>Dilewati</Lencana>,
};

/* ---------- Langkah 1: terima bayar penjual lain ---------- */
function LangkahTerima({ d, tgl }: { d: DataSelasa; tgl: string }) {
  const aksi = useAksi();
  const { konfirmasiTanggal } = useDialog();
  const inv = d.invoiceQ.data;

  async function catat(i: Invoice) {
    const tglBayar = await konfirmasiTanggal(`Catat pembayaran ${rp(i.grand_total)} dari ${i.kepada.nama}?`, {
      awal: tgl,
      teks: `${i.items.length} order. Uang masuk ke Kas utama sebagai Penjualan penjual lain.`,
      label: "Tanggal uang diterima",
      ok: "Catat pembayaran",
    });
    if (tglBayar) aksi.mutate({ path: "/penerimaan-reseller", body: { pelanggan_id: i.kepada.pelanggan_id, tanggal: tglBayar, order_ids: i.items.map((x) => x.order_id) } });
  }

  return (
    <Flex vertical gap="small" style={{ width: "100%" }}>
      <ErrorBox error={d.invoiceQ.error ?? aksi.error} />
      <Typography.Text>
        Jatuh tempo Selasa ini: <b>{rp(d.tagihanSelasaIni)}</b> dari {inv?.length ?? 0} penjual lain
        <Typography.Text type="secondary"> · semua belum dibayar {rp(d.semuaBelumDibayar)}</Typography.Text>
      </Typography.Text>
      {d.invoiceQ.isLoading && <Memuat />}
      {inv?.length === 0 && <Kosong teks="Tidak ada tagihan penjual lain yang jatuh tempo Selasa ini." />}
      {inv?.map((i) => (
        <Flex key={i.nomor} justify="space-between" align="center" gap="small" wrap style={{ padding: "8px 0", borderBottom: "1px solid var(--ant-color-split)" }}>
          <div>
            <Typography.Text strong>{i.kepada.nama}</Typography.Text>{" "}
            <Typography.Text type="secondary">
              · {i.nomor} · {i.items.length} order
            </Typography.Text>{" "}
            {i.items.some((x) => x.terlambat) && <Lencana warna="oranye">ada yang terlambat</Lencana>}
          </div>
          <Flex gap="small" align="center">
            <Angka tebal>{rp(i.grand_total)}</Angka>
            <Button disabled={aksi.isPending} onClick={() => void catat(i)}>
              Catat diterima
            </Button>
          </Flex>
        </Flex>
      ))}
      <Link to="/penjual-lain">PDF & kirim invoice di Tagihan penjual lain →</Link>
    </Flex>
  );
}

/* ---------- Langkah 3: tarik saldo ---------- */
function LangkahTarik({ d, tgl }: { d: DataSelasa; tgl: string }) {
  const aksi = useAksi();
  const [dari, setDari] = useState("");
  const [jumlah, setJumlah] = useState("");
  const akun = d.akunQ.data ?? [];
  const kasUtama = akun.find((a) => a.kode === "KAS_UTAMA");
  const sumber = akunSaldoToko(akun);
  const sumberId = dari || sumber.find((a) => num(a.saldo) > 0)?.id || sumber[0]?.id || "";
  const sumberPilih = sumber.find((a) => a.id === sumberId);
  const nilai = bersihkanAngka(jumlah || String(Math.max(0, Math.round(num(sumberPilih?.saldo)))));
  const nama = new Map(akun.map((a) => [a.id, a.nama]));
  const tarikan = (d.transferQ.data ?? []).filter((t) => !t.dibatalkan && t.ke_akun_id === kasUtama?.id && sumber.some((a) => a.id === t.dari_akun_id));

  if (sumber.length === 0) return <Kosong teks="Belum ada akun saldo toko (e-wallet/bank). Tambahkan di Data master > Akun kas & kategori." />;
  return (
    <Flex vertical gap="small" align="flex-start" style={{ width: "100%" }}>
      <Typography.Text type="secondary">Cocokkan dulu dengan saldo di seller center. Penarikan hanya memindahkan uang, bukan pemasukan.</Typography.Text>
      <Row gutter={16} style={{ width: "100%" }}>
        <Col xs={24} md={12}>
          <Field label="Dari akun">
            <Select aria-label="Dari akun" value={sumberId} onChange={(e) => setDari(e.target.value)}>
              {sumber.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({rp(a.saldo)})
                </option>
              ))}
            </Select>
          </Field>
        </Col>
        <Col xs={24} md={12}>
          <Field label="Jumlah (Rp)" hint={sumberPilih ? `Saldo ${rp(sumberPilih.saldo)}; kosongkan untuk tarik semua` : undefined}>
            <Input inputMode="numeric" placeholder={sumberPilih ? String(Math.round(num(sumberPilih.saldo))) : "0"} value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
          </Field>
        </Col>
      </Row>
      <Button
        disabled={aksi.isPending || !kasUtama || !sumberId || !num(nilai)}
        onClick={() =>
          aksi.mutate(
            { path: "/transfer", body: { tanggal: tgl, dari_akun_id: sumberId, ke_akun_id: kasUtama?.id, jumlah: nilai, keterangan: "Tarik saldo toko" } },
            { onSuccess: () => setJumlah("") },
          )
        }
      >
        Tarik ke Kas utama
      </Button>
      <ErrorBox error={d.transferQ.error ?? aksi.error} />
      {tarikan.length > 0 && (
        <div style={{ width: "100%" }}>
          <Typography.Text strong>Sudah ditarik minggu ini</Typography.Text>
          {tarikan.map((t) => (
            <Flex key={t.id} justify="space-between">
              <Typography.Text>
                {tanggal(t.tanggal)} · {nama.get(t.dari_akun_id) ?? "—"}
              </Typography.Text>
              <Angka>{rp(t.jumlah)}</Angka>
            </Flex>
          ))}
        </div>
      )}
      <Typography.Text type="secondary">
        Salah jumlah? Batalkan di <Link to="/keuangan">Kas & transaksi</Link>, lalu catat ulang.
      </Typography.Text>
    </Flex>
  );
}

/* ---------- Langkah 4: bayar tukang & supplier ---------- */
const kolomTukang: TableColumnsType<SiapBayar["pemasok"][number]> = [
  { title: "Tukang & supplier", dataIndex: "nama" },
  { title: "Order", render: (_, p) => p.items.length, align: "right", width: 80 },
  { title: "Jumlah", dataIndex: "subtotal", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

function LangkahBayarTukang({ d, tgl }: { d: DataSelasa; tgl: string }) {
  const aksi = useAksi();
  const { konfirmasi } = useDialog();
  const siap = d.siapQ.data;
  return (
    <Flex vertical gap="small" align="flex-start" style={{ width: "100%" }}>
      <ErrorBox error={d.siapQ.error ?? aksi.error} />
      {d.siapQ.isLoading && <Memuat />}
      {siap?.sudah_dicatat_id && <Alert type="success" showIcon title="Pembayaran tukang & supplier minggu ini sudah dicatat." />}
      {siap && !siap.sudah_dicatat_id && siap.pemasok.length === 0 && <Kosong teks={`Tidak ada yang perlu dibayar. Barang yang diambil sampai ${tanggal(siap.batas_diambil)} sudah lunas.`} />}
      {siap && !siap.sudah_dicatat_id && siap.pemasok.length > 0 && (
        <>
          <Typography.Text type="secondary">Barang yang diambil sampai {tanggal(siap.batas_diambil)}. Uang keluar dari Kas utama.</Typography.Text>
          <div style={{ width: "100%" }}>
            <DataTabel kolom={kolomTukang} data={siap.pemasok} rowKey="pemasok_id" minLebar={360} ringkasan={() => <BarisTotal sel={[{ isi: "Total", span: 2 }, { isi: rp(siap.total), kanan: true }]} />} />
          </div>
          <Button
            disabled={aksi.isPending}
            onClick={() =>
              void konfirmasi(`Catat pembayaran ${rp(siap.total)} ke tukang & supplier?`, { teks: `Uang keluar dari Kas utama, tanggal ${tanggal(tgl)}.`, ok: "Catat pembayaran" }).then(
                (ok) => ok && aksi.mutate({ path: "/pembayaran-pemasok", body: { tanggal: tgl } }),
              )
            }
          >
            Catat pembayaran {rp(siap.total)}
          </Button>
          <Typography.Text type="secondary">Saat ini satu pembayaran untuk semua tukang & supplier per minggu.</Typography.Text>
        </>
      )}
      <Link to="/pesanan-tukang">Rincian, PDF rekap & kirim rekap di Bayar tukang & supplier →</Link>
    </Flex>
  );
}

/* ---------- Langkah 6: sisihkan dana gaji ---------- */
const kolomSisihan: TableColumnsType<Sisihan["items"][number]> = [
  { title: "Karyawan", dataIndex: "nama" },
  { title: "Cicilan", dataIndex: "jumlah", align: "right", render: (v: string) => <Angka>{rp(v)}</Angka> },
];

function LangkahSisihan({ d, tgl }: { d: DataSelasa; tgl: string }) {
  const aksi = useAksi();
  const { tanya } = useDialog();
  const s = d.sisihanQ.data;
  return (
    <Flex vertical gap="small" align="flex-start" style={{ width: "100%" }}>
      <ErrorBox error={d.sisihanQ.error ?? aksi.error} />
      {d.sisihanQ.isLoading && <Memuat />}
      {s && (
        <>
          <Typography.Text type="secondary">
            Gaji bulanan ÷ 4 dipindah dari Kas utama ke Dana cadangan. Periode {s.periode} · Selasa ke-{s.minggu_ke}. {s.catatan}
          </Typography.Text>
          {s.items.length === 0 && <Kosong teks="Tidak ada gaji yang perlu disisihkan. Tambahkan karyawan di Gaji & tagihan rutin." />}
          {s.items.length > 0 && (
            <div style={{ width: "100%" }}>
              <DataTabel kolom={kolomSisihan} data={s.items} rowKey="nama" minLebar={320} ringkasan={() => <BarisTotal sel={[{ isi: "Total" }, { isi: rp(s.total), kanan: true }]} />} />
            </div>
          )}
          {s.items.length > 0 && !s.cukup && !s.sudah_dicatat_id && <Typography.Text type="danger">Saldo Kas utama {rp(s.saldo_kas_utama)} belum cukup. Kerjakan langkah 1 dan 3 dulu.</Typography.Text>}
          <Flex gap="small" wrap>
            {!s.sudah_dicatat_id && s.items.length > 0 && (
              <Button disabled={aksi.isPending || !s.cukup} onClick={() => aksi.mutate({ path: "/sisihan", body: { tanggal: tgl } })}>
                Sisihkan {rp(s.total)}
              </Button>
            )}
            {s.sudah_dicatat_id && (
              <Button
                variant="bahaya"
                disabled={aksi.isPending}
                onClick={() =>
                  void tanya("Batalkan penyisihan dana gaji?", { label: "Alasan pembatalan", min: 3, panjang: true, ok: "Batalkan penyisihan" }).then(
                    (alasan) => alasan && aksi.mutate({ path: `/sisihan/${s.sudah_dicatat_id}/batal`, body: { alasan } }),
                  )
                }
              >
                Batalkan penyisihan
              </Button>
            )}
          </Flex>
        </>
      )}
    </Flex>
  );
}

/* ---------- Langkah 7: isi kas kecil & kas iklan ---------- */
function Pengisian({ jenis, label, q }: { jenis: "kas-kecil" | "kas-iklan"; label: string; q: { data?: PengisianImprest; error: unknown } }) {
  const aksi = useAksi();
  const d = q.data;
  const perlu = num(d?.perlu_diisi);
  return (
    <Flex vertical gap="small" align="flex-start">
      <ErrorBox error={q.error ?? aksi.error} />
      {d && (
        <>
          <Typography.Text>
            Saldo {label} <b>{rp(d.saldo)}</b> dari plafon <b>{rp(d.plafon)}</b> → perlu diisi{" "}
            <Typography.Text strong type={perlu > 0 ? "warning" : undefined}>
              {rp(perlu)}
            </Typography.Text>
          </Typography.Text>
          {perlu > 0 && !d.cukup && <Typography.Text type="danger">Saldo Kas utama {rp(d.saldo_kas_utama)} belum cukup. Tarik saldo toko dulu (langkah 3).</Typography.Text>}
          <Button disabled={aksi.isPending || perlu <= 0 || !d.cukup} onClick={() => aksi.mutate({ path: `/${jenis}/pengisian` })}>
            {perlu <= 0 ? "Sudah penuh" : `Isi ${label} ${rp(perlu)}`}
          </Button>
        </>
      )}
    </Flex>
  );
}

function LangkahIsiKas({ d, admin }: { d: DataSelasa; admin: boolean }) {
  const iklan = d.kasIklanQ.data;
  return (
    <Flex vertical gap="middle" align="flex-start">
      <Typography.Text type="secondary">Isi ulang = transfer dari Kas utama sampai plafon, bukan biaya. Tercatat dengan tanggal hari ini ({tanggal(hariIni())}).</Typography.Text>
      <Pengisian jenis="kas-kecil" label="kas kecil" q={d.kasKecilQ} />
      {admin && iklan && num(iklan.plafon) > 0 && <Pengisian jenis="kas-iklan" label="kas iklan" q={d.kasIklanQ} />}
    </Flex>
  );
}

/* ---------- Wizard ---------- */
export default function Selasa() {
  const { user } = useAuth();
  const pemilik = isPemilik(user?.role);
  const admin = user?.role === "admin";
  const [tgl, setTgl] = useState(() => selasaAcuan(hariIni()));
  const d = useSelasa(tgl, admin, pemilik);
  const [pilih, setPilih] = useState<IdLangkah | null>(null);
  // Bawaan: langkah pertama yang belum dikerjakan.
  const aktif = pilih ?? LANGKAH_AKTIF.find((l) => d.status[l.id] === "belum")?.id ?? LANGKAH_AKTIF[LANGKAH_AKTIF.length - 1].id;
  const posisi = LANGKAH_AKTIF.findIndex((l) => l.id === aktif);

  if (!pemilik) return null;
  if (d.akunQ.isLoading) return <Memuat />;

  const isi: Record<string, ReactNode> = {
    terima: <LangkahTerima d={d} tgl={tgl} />,
    tarik: <LangkahTarik d={d} tgl={tgl} />,
    bayar_tukang: <LangkahBayarTukang d={d} tgl={tgl} />,
    sisihan: <LangkahSisihan d={d} tgl={tgl} />,
    isi_kas: <LangkahIsiKas d={d} admin={admin} />,
  };

  const ke = (geser: number) => {
    const l = LANGKAH_AKTIF[posisi + geser];
    if (l) setPilih(l.id);
  };

  const panel = (id: IdLangkah) => {
    const st = d.status[id];
    const otomatis = d.otomatis[id];
    return (
      <Flex vertical gap="middle" style={{ width: "100%", paddingBottom: 8 }}>
        {isi[id]}
        <Flex gap="small" wrap justify="space-between" style={{ borderTop: "1px solid var(--ant-color-split)", paddingTop: 12 }}>
          <Flex gap="small" wrap>
            {!otomatis && st === "belum" && (
              <>
                <Button variant="pinggir" onClick={() => d.tandai(id, "selesai")}>
                  Tandai selesai
                </Button>
                <Button variant="pinggir" onClick={() => d.tandai(id, "dilewati")}>
                  Lewati langkah
                </Button>
              </>
            )}
            {!otomatis && st !== "belum" && (
              <Button variant="pinggir" onClick={() => d.tandai(id, null)}>
                Tandai belum
              </Button>
            )}
          </Flex>
          <Flex gap="small">
            <Button variant="pinggir" disabled={posisi <= 0} onClick={() => ke(-1)}>
              ← Sebelumnya
            </Button>
            <Button variant="pinggir" disabled={posisi >= LANGKAH_AKTIF.length - 1} onClick={() => ke(1)}>
              Berikutnya →
            </Button>
          </Flex>
        </Flex>
      </Flex>
    );
  };

  return (
    <>
      <PageHeader
        judul="Tutup Kas Mingguan"
        sub={`Minggu dengan Selasa ${tanggalHari(d.selasa)} (biasanya tiap Selasa) · ${d.selesai} dari ${d.total} langkah selesai`}
        aksi={
          <div style={{ width: 200 }}>
            <Field label="Tanggal pencatatan" hint="Bawaan: Selasa minggu ini">
              <InputTanggal value={tgl} onChange={setTgl} />
            </Field>
          </div>
        }
      />
      <Card>
        <Flex vertical gap="small" style={{ marginBottom: 16 }}>
          <Progress nilai={d.beres} maks={d.total} />
          {d.beres === d.total && <Alert type="success" showIcon title="Tutup kas minggu ini selesai. Terima kasih!" />}
        </Flex>
        <Steps
          orientation="vertical"
          current={LANGKAH.findIndex((l) => l.id === aktif)}
          items={LANGKAH.map((l, i) => {
            const st = l.segera ? undefined : d.status[l.id];
            const sekarang = l.id === aktif;
            return {
              disabled: Boolean(l.segera),
              status: st === "selesai" ? ("finish" as const) : sekarang ? ("process" as const) : ("wait" as const),
              title: (
                <Flex gap="small" align="center" wrap data-langkah={l.id}>
                  {l.segera ? (
                    <Typography.Text type="secondary">
                      {i + 1}. {l.judul}
                    </Typography.Text>
                  ) : (
                    <button type="button" className="judul-langkah" aria-expanded={sekarang} onClick={() => setPilih(l.id)}>
                      <Typography.Text strong={sekarang}>
                        {i + 1}. {l.judul}
                      </Typography.Text>
                    </button>
                  )}
                  {l.segera ? <Lencana>Segera hadir</Lencana> : st && LABEL_STATUS[st]}
                </Flex>
              ),
              content: l.segera ? <Typography.Text type="secondary">{l.segera}</Typography.Text> : sekarang ? panel(l.id) : null,
            };
          })}
        />
      </Card>
    </>
  );
}
