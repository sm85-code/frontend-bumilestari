import { Flex, Typography } from "antd";
import { useState } from "react";
import { Angka, ErrorBox, Kosong, Lencana, Memuat, TombolLink, useDialog } from "./ui";
import { useAksi } from "../lib/data";
import { bersihkanAngka, num, rp, tanggal } from "../lib/format";
import { perOrang, useTalangan } from "../lib/talangan";
import type { Talangan } from "../lib/types";

/**
 * Talangan per orang (spesifikasi 8.8, 11.3). "Lunasi" = transfer Kas utama → orang itu (bukan biaya lagi; biayanya sudah
 * dicatat saat pengeluaran). Boleh sebagian. `riwayat`: tampilkan juga yang lunas/dibatalkan beserta pembatalan.
 */
export default function DaftarTalangan({ tanggalBayar, riwayat }: { tanggalBayar?: string; riwayat?: boolean }) {
  const [semua, setSemua] = useState(false);
  const q = useTalangan(true, riwayat && semua ? "semua" : "belum_lunas");
  const aksi = useAksi<Talangan>();
  const { konfirmasi, tanya } = useDialog();

  async function lunasi(t: Talangan, sebagian: boolean) {
    let jumlah: string | null = null;
    if (sebagian) {
      const isi = await tanya(`Lunasi sebagian talangan ${t.nama}`, { label: `Sisa ${rp(t.sisa)}. Tulis jumlah yang dibayar dari Kas utama.`, min: 1, ok: "Lunasi" });
      if (!isi) return;
      jumlah = bersihkanAngka(isi);
      if (!jumlah) return;
    } else if (!(await konfirmasi(`Lunasi talangan ${t.nama} ${rp(t.sisa)}?`, { teks: "Dibayar dari Kas utama. Tidak menambah biaya.", ok: "Lunasi" }))) return;
    aksi.mutate({ path: `/talangan/${t.id}/lunasi`, body: { jumlah, tanggal: tanggalBayar ?? null } });
  }
  async function batal(path: string, judul: string) {
    const alasan = await tanya(judul, { label: "Tulis alasannya.", min: 3, panjang: true, ok: "Batalkan" });
    if (alasan) aksi.mutate({ path, body: { alasan } });
  }

  if (q.isLoading) return <Memuat />;
  const daftar = q.data ?? [];
  return (
    <Flex vertical gap="middle" style={{ width: "100%" }}>
      <ErrorBox error={q.error ?? aksi.error} />
      {riwayat && (
        <TombolLink onClick={() => setSemua((x) => !x)}>{semua ? "Tampilkan yang belum lunas saja" : "Tampilkan riwayat (lunas & dibatalkan)"}</TombolLink>
      )}
      {daftar.length === 0 && <Kosong teks="Tidak ada talangan yang belum lunas." />}
      {perOrang(daftar).map(([nama, sisa, list]) => (
        <div key={nama} data-talangan-orang={nama}>
          <Flex justify="space-between" align="baseline">
            <Typography.Text strong>{nama}</Typography.Text>
            <Typography.Text strong>
              Sisa <Angka>{rp(sisa)}</Angka>
            </Typography.Text>
          </Flex>
          {list.map((t) => (
            <Flex key={t.id} justify="space-between" align="center" gap="small" wrap style={{ padding: "6px 0", borderBottom: "1px solid var(--ant-color-split)" }}>
              <Flex vertical style={{ minWidth: 0 }}>
                <Typography.Text>
                  {tanggal(t.tanggal)} · {t.akun_asal_nama} · {t.keterangan || "tanpa keterangan"}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Talangan {rp(t.jumlah)} dari pengeluaran {rp(t.total_pengeluaran)}
                  {num(t.terbayar) > 0 && ` · sudah dibayar ${rp(t.terbayar)}`}
                  {t.status_kirim === "draf" && " · draf"}
                </Typography.Text>
                {riwayat &&
                  t.bayar
                    .filter((b) => !b.dibatalkan)
                    .map((b) => (
                      <Typography.Text key={b.id} type="secondary" style={{ fontSize: 12 }}>
                        Dibayar {tanggal(b.tanggal)} {rp(b.jumlah)}{" "}
                        <TombolLink bahaya disabled={aksi.isPending} onClick={() => void batal(`/talangan/bayar/${b.id}/batal`, `Batalkan pelunasan ${rp(b.jumlah)}?`)}>
                          Batalkan pelunasan
                        </TombolLink>
                      </Typography.Text>
                    ))}
              </Flex>
              {t.dibatalkan ? (
                <Lencana warna="merah">Dibatalkan</Lencana>
              ) : num(t.sisa) <= 0 ? (
                <Lencana warna="hijau">Lunas</Lencana>
              ) : (
                <Flex gap="small">
                  <TombolLink disabled={aksi.isPending} onClick={() => void lunasi(t, false)}>
                    Lunasi {rp(t.sisa)}
                  </TombolLink>
                  <TombolLink disabled={aksi.isPending} onClick={() => void lunasi(t, true)}>
                    Sebagian
                  </TombolLink>
                  {riwayat && num(t.terbayar) === 0 && (
                    <TombolLink bahaya disabled={aksi.isPending} onClick={() => void batal(`/talangan/${t.id}/batal`, `Batalkan pengeluaran bertalangan ${rp(t.total_pengeluaran)}?`)}>
                      Batalkan
                    </TombolLink>
                  )}
                </Flex>
              )}
            </Flex>
          ))}
        </div>
      ))}
    </Flex>
  );
}
