import { Checkbox, Form, Typography } from "antd";
import { useState } from "react";
import { AksiForm, Button, Field, Formulir, InputTanggal, Teks } from "./ui";
import { useAksi } from "../lib/data";
import { hariIni, tanggal as fmtTanggal } from "../lib/format";
import type { Order } from "../lib/types";

/**
 * Retur sebelum cair (AB-BC-3): order keluar dari daftar belum cair; biaya tukangnya dilaporkan sebagai
 * Kerugian retur. Retur setelah cair tidak dicatat di sini (datang dari file pencairan).
 */
export default function FormReturOrder({ order, onSelesai }: { order: Order; onSelesai: () => void }) {
  const aksi = useAksi<Order>();
  const [tgl, setTgl] = useState(hariIni());
  const [alasan, setAlasan] = useState("");
  const [stok, setStok] = useState(false);
  const kirim = () =>
    aksi.mutate(
      { path: `/order/${order.id}/retur`, body: { tanggal: tgl, alasan: alasan.trim(), kembali_stok: stok } },
      { onSuccess: onSelesai },
    );
  return (
    <Formulir onKirim={kirim}>
      <Typography.Paragraph type="secondary">
        Dikirim {order.tgl_dikirim ? fmtTanggal(order.tgl_dikirim) : "—"}. Order keluar dari daftar belum cair; biaya tukang order ini dicatat sebagai
        Kerugian retur (bila belum dibayar, tukang tetap dibayar).
      </Typography.Paragraph>
      <Field label="Tanggal retur">
        <InputTanggal value={tgl} onChange={setTgl} />
      </Field>
      <Field label="Alasan retur">
        <Teks aria-label="Alasan retur" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="mis. barang rusak saat dikirim" />
      </Field>
      <Form.Item>
        <Checkbox checked={stok} onChange={(e) => setStok(e.target.checked)}>
          Barang kembali ke stok (catatan saja, tanpa nilai stok)
        </Checkbox>
      </Form.Item>
      <AksiForm error={aksi.error}>
        <Button type="submit" variant="bahaya" disabled={aksi.isPending || alasan.trim().length < 3 || !tgl}>
          Tandai retur
        </Button>
      </AksiForm>
    </Formulir>
  );
}
