import { WhatsAppOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Space, Typography } from "antd";
import { Button, ErrorBox } from "./ui";
import { useAksi } from "../lib/data";
import type { Bagikan } from "../lib/types";

/**
 * Tombol "Kirim ke WhatsApp": backend menyimpan salinan dokumen dan membuat tautan PDF; lalu wa_link dibuka
 * (di HP -> aplikasi WhatsApp terbuka dengan pesan siap kirim).
 */
export default function BagikanWA({ jenis, id, tanggal, label = "Kirim ke WhatsApp" }: { jenis: "invoice" | "po"; id: string; tanggal?: string; label?: string }) {
  const aksi = useAksi<Bagikan>();
  const [hasil, setHasil] = useState<Bagikan | null>(null);

  function kirim() {
    aksi.mutate(
      { path: "/dokumen/bagikan", body: { jenis, tanggal, pelanggan_id: jenis === "invoice" ? id : undefined, pemasok_id: jenis === "po" ? id : undefined } },
      {
        onSuccess: (d) => {
          setHasil(d);
          window.open(d.wa_link, "_blank", "noopener");
        },
      },
    );
  }

  return (
    <Space direction="vertical" size={4}>
      <Button variant="pinggir" kecil disabled={aksi.isPending} onClick={kirim}>
        {aksi.isPending ? "Menyiapkan…" : <><WhatsAppOutlined /> {label}</>}
      </Button>
      <ErrorBox error={aksi.error} />
      {hasil && !hasil.no_wa && <Typography.Text type="warning">Nomor WhatsApp belum diisi; pilih kontak sendiri di WhatsApp.</Typography.Text>}
    </Space>
  );
}
