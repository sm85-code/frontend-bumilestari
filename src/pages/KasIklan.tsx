import { useQuery } from "@tanstack/react-query";
import { Col, Flex, Row, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import DaftarTransaksi from "../components/DaftarTransaksi";
import FormTransaksi from "../components/FormTransaksi";
import KirimKeLaporan from "../components/KirimKeLaporan";
import UbahPlafon from "../components/UbahPlafon";
import { Angka, Button, Card, DataTabel, ErrorBox, Field, Input, Kosong, Lencana, Memuat, PageHeader, Progress, Select, TombolLink, useDialog } from "../components/ui";
import { api, query } from "../lib/api";
import { useAksi } from "../lib/data";
import { bersihkanAngka, hariIni, num, rp } from "../lib/format";
import { LABEL_GRUP, useBudgetIklan, usePlatformIklan } from "../lib/iklan";
import type { AkunKas, Kategori, PengaturanIklan, PlatformIklan, Transaksi } from "../lib/types";

/**
 * Kas iklan (khusus admin, spesifikasi 8.7). Top up = Biaya iklan (draf, wajib platform), sisa budget 25/75 bulan ini,
 * pengembalian ke Kas utama, plafon & lognya, pengaturan platform dan porsi budget.
 */
export default function KasIklan() {
  const akunQ = useQuery({ queryKey: ["akun"], queryFn: () => api<AkunKas[]>("/akun-kas") });
  const katQ = useQuery({ queryKey: ["kategori"], queryFn: () => api<Kategori[]>("/kategori") });
  const kas = akunQ.data?.find((a) => a.jenis === "kas_iklan");
  const trxQ = useQuery({
    queryKey: ["transaksi", kas?.id, "draf"],
    enabled: !!kas,
    queryFn: () => api<Transaksi[]>(`/transaksi${query({ akun_id: kas?.id, termasuk_draf: "true" })}`),
  });
  const budgetQ = useBudgetIklan(hariIni());
  const platformQ = usePlatformIklan();
  const aksi = useAksi();
  const { tanya } = useDialog();

  if (akunQ.isLoading || katQ.isLoading) return <Memuat />;
  if (akunQ.error || katQ.error) return <ErrorBox error={akunQ.error ?? katQ.error} />;
  if (!kas) return <Kosong teks="Akun Kas iklan belum ada. Jalankan penyiapan data awal." />;
  const saldo = num(kas.saldo_setelah_draf ?? kas.saldo);
  const plafon = num(kas.plafon);
  const lebih = saldo - plafon;
  const nama = new Map((platformQ.data ?? []).map((p) => [p.id, p.nama]));

  async function kembalikan(semua: boolean) {
    const alasan = await tanya(semua ? `Kembalikan seluruh sisa ${rp(saldo)} ke Kas utama?` : `Kembalikan kelebihan ${rp(lebih)} ke Kas utama?`, {
      label: "Keterangan (mis. plafon diturunkan / iklan dihentikan).",
      min: 3,
      ok: "Kembalikan",
    });
    if (alasan) aksi.mutate({ path: "/kas-iklan/pengembalian", body: { jumlah: semua ? String(saldo) : null, tanggal: hariIni(), keterangan: alasan } });
  }

  return (
    <>
      <PageHeader judul="Kas iklan" sub="Top up iklan menjadi Biaya iklan. Owner hanya melihat satu baris Biaya iklan di laba rugi." />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Flex vertical gap="middle">
            <Card judul="Saldo kas iklan" sub={`plafon ${rp(plafon)}`}>
              <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 8 }}>
                <Angka>{rp(saldo)}</Angka>
              </div>
              <Progress nilai={saldo} maks={plafon} />
              <Flex gap="small" wrap style={{ marginTop: 12 }}>
                {lebih > 0 && (
                  <Button kecil onClick={() => void kembalikan(false)}>
                    Kembalikan kelebihan {rp(lebih)}
                  </Button>
                )}
                {saldo > 0 && (
                  <Button variant="pinggir" kecil onClick={() => void kembalikan(true)}>
                    Kembalikan semua
                  </Button>
                )}
                <UbahPlafon akun={kas} />
              </Flex>
              <ErrorBox error={aksi.error} />
            </Card>
            <Card judul="Top up iklan">
              <FormTransaksi akun={[kas]} kategori={katQ.data ?? []} jenisTetap="keluar" akunAwal={kas.id} />
            </Card>
          </Flex>
        </Col>
        <Col xs={24} lg={15}>
          <Flex vertical gap="middle">
            <Card judul="Budget iklan bulan ini" sub={budgetQ.data?.dasar === "plafon" ? "Budget = plafon × jumlah Selasa bulan ini (ubah di Pengaturan)" : undefined}>
              <ErrorBox error={budgetQ.error} />
              {budgetQ.data && (
                <Row gutter={[16, 16]} data-budget>
                  {budgetQ.data.grup.map((g) => (
                    <Col key={g.grup} xs={24} md={12}>
                      <Typography.Text strong>
                        {LABEL_GRUP[g.grup]} · {num(g.porsi)}%
                      </Typography.Text>
                      <Progress nilai={num(g.terpakai)} maks={num(g.budget)} />
                      <Typography.Text type={num(g.sisa) < 0 ? "danger" : "secondary"}>
                        Terpakai {rp(g.terpakai)} dari {rp(g.budget)} · sisa {rp(g.sisa)}
                      </Typography.Text>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
            <Card judul="Riwayat top up">
              <div style={{ marginBottom: 12 }}>
                <KirimKeLaporan sumber="kas_iklan" />
              </div>
              <DaftarTransaksi
                data={trxQ.data?.map((t) => ({ ...t, keterangan: [nama.get(t.platform_iklan_id ?? ""), t.keterangan].filter(Boolean).join(" · ") }))}
                kategori={katQ.data ?? []}
                bolehBatal
                memuat={trxQ.isLoading}
                kosong="Belum ada top up."
              />
            </Card>
            <Pengaturan platform={platformQ.data ?? []} />
          </Flex>
        </Col>
      </Row>
    </>
  );
}

function Pengaturan({ platform }: { platform: PlatformIklan[] }) {
  const q = useQuery({ queryKey: ["pengaturan-iklan"], queryFn: () => api<PengaturanIklan>("/kas-iklan/pengaturan") });
  const aksi = useAksi();
  const [internal, setInternal] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [grup, setGrup] = useState<"internal" | "eksternal">("eksternal");
  const porsi = internal ?? String(num(q.data?.porsi_internal ?? 25));
  const budgetIsi = budget ?? (q.data?.budget_bulanan ? String(Math.round(num(q.data.budget_bulanan))) : "");

  const kolom: TableColumnsType<PlatformIklan> = [
    { title: "Platform", dataIndex: "nama" },
    { title: "Grup", dataIndex: "grup", render: (g: PlatformIklan["grup"]) => LABEL_GRUP[g] },
    { title: "Status", dataIndex: "aktif", render: (a: boolean) => (a ? <Lencana warna="hijau">Aktif</Lencana> : <Lencana>Nonaktif</Lencana>) },
    {
      title: "",
      render: (_, p) => (
        <TombolLink disabled={aksi.isPending} onClick={() => aksi.mutate({ path: `/platform-iklan/${p.id}`, method: "PATCH", body: { aktif: !p.aktif } })}>
          {p.aktif ? "Nonaktifkan" : "Aktifkan"}
        </TombolLink>
      ),
    },
  ];
  return (
    <Card judul="Pengaturan platform & budget">
      <ErrorBox error={q.error ?? aksi.error} />
      <Flex gap="small" wrap align="flex-end">
        <Field label="Porsi internal (%)" hint={`Eksternal ${100 - Number(porsi || 0)}%`}>
          <Input aria-label="Porsi internal" inputMode="numeric" value={porsi} onChange={(e) => setInternal(e.target.value)} />
        </Field>
        <Field label="Budget bulanan (Rp)" hint="Kosong = plafon × jumlah Selasa">
          <Input aria-label="Budget bulanan" inputMode="numeric" value={budgetIsi} onChange={(e) => setBudget(e.target.value)} />
        </Field>
        <Field label=" ">
          <Button
            kecil
            disabled={aksi.isPending || Number(porsi) < 0 || Number(porsi) > 100}
            onClick={() =>
              aksi.mutate({
                path: "/kas-iklan/pengaturan",
                method: "PUT",
                body: { porsi_internal: String(Number(porsi)), porsi_eksternal: String(100 - Number(porsi)), budget_bulanan: bersihkanAngka(budgetIsi) || null },
              })
            }
          >
            Simpan budget
          </Button>
        </Field>
      </Flex>
      <DataTabel kolom={kolom} data={platform} rowKey="id" minLebar={680} kosong="Belum ada platform" />
      <Flex gap="small" wrap align="flex-end" style={{ marginTop: 12 }}>
        <Field label="Platform baru">
          <Input aria-label="Nama platform" value={nama} onChange={(e) => setNama(e.target.value)} />
        </Field>
        <Field label="Grup">
          <Select aria-label="Grup platform" value={grup} onChange={(e) => setGrup(e.target.value as "internal" | "eksternal")}>
            <option value="internal">Internal marketplace</option>
            <option value="eksternal">Eksternal</option>
          </Select>
        </Field>
        <Field label=" ">
          <Button kecil disabled={nama.trim().length < 2 || aksi.isPending} onClick={() => aksi.mutate({ path: "/platform-iklan", body: { nama: nama.trim(), grup } }, { onSuccess: () => setNama("") })}>
            Tambah platform
          </Button>
        </Field>
      </Flex>
    </Card>
  );
}
