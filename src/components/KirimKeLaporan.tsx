import { Alert, Flex, Typography } from "antd";
import { Link } from "react-router-dom";
import { isPemilik, useAuth } from "../auth/AuthContext";
import { Button, ErrorBox, useDialog } from "./ui";
import { useAksi } from "../lib/data";
import { tanggal } from "../lib/format";
import { LABEL_SUMBER, ringkasDraf, teksDraf, useDraf } from "../lib/kiriman";
import type { Kiriman, SumberKiriman } from "../lib/types";

/**
 * Tombol "Kirim ke laporan keuangan" untuk satu sumber (kas kecil, kas iklan, penerimaan penjual lain, pembayaran tukang &
 * supplier). Menampilkan jumlah draf, total, dan tanggal tertua; setelah dikirim catatan terkunci. Staf hanya melihat
 * keterangan bahwa catatannya masih draf sampai admin/owner mengirimnya.
 */
export default function KirimKeLaporan({ sumber, sampaiTanggal, tanpaTautan }: { sumber: SumberKiriman; sampaiTanggal?: string; tanpaTautan?: boolean }) {
  const { user } = useAuth();
  const pemilik = isPemilik(user?.role);
  const draf = useDraf(sumber, pemilik);
  const aksi = useAksi<Kiriman>();
  const { konfirmasi, message } = useDialog();

  if (!pemilik) {
    return <Typography.Text type="secondary">Catatan baru berstatus Draf sampai admin atau owner mengirimnya ke laporan keuangan.</Typography.Text>;
  }
  const r = ringkasDraf(draf.data?.filter((x) => x.sumber === sumber));
  const label = LABEL_SUMBER[sumber];

  async function kirim() {
    const ok = await konfirmasi(`Kirim ${label.toLowerCase()} ke laporan keuangan?`, {
      teks: (
        <>
          {teksDraf(r)}
          {sampaiTanggal ? ` (sampai ${tanggal(sampaiTanggal)})` : ""}. Setelah dikirim catatan terkunci dan masuk laporan, saldo resmi dan laba. Salah catat? Batalkan
          kirimannya di Riwayat kiriman.
        </>
      ),
      ok: "Kirim ke laporan keuangan",
    });
    if (!ok) return;
    aksi.mutate(
      { path: "/kiriman", body: { sumber, sampai_tanggal: sampaiTanggal ?? null } },
      { onSuccess: (k) => void message.success(`Terkirim: ${k.nomor} (${k.jumlah_entri} catatan).`) },
    );
  }

  return (
    <Flex vertical gap="small" style={{ width: "100%" }} data-kirim={sumber}>
      <ErrorBox error={draf.error ?? aksi.error} />
      {draf.data && r.jumlah === 0 && <Typography.Text type="secondary">Semua catatan {label.toLowerCase()} sudah dikirim ke laporan keuangan.</Typography.Text>}
      {r.jumlah > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`${teksDraf(r)} belum masuk laporan keuangan.`}
          action={
            <Button disabled={aksi.isPending} onClick={() => void kirim()}>
              Kirim ke laporan keuangan
            </Button>
          }
        />
      )}
      {!tanpaTautan && <Link to="/kiriman">Riwayat kiriman →</Link>}
    </Flex>
  );
}
