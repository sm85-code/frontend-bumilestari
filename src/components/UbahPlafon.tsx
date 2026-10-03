import { useQuery } from "@tanstack/react-query";
import { Flex, Typography } from "antd";
import { useState } from "react";
import { Button, ErrorBox, Field, Input } from "./ui";
import { api } from "../lib/api";
import { useAksi } from "../lib/data";
import { bersihkanAngka, rp, tanggal } from "../lib/format";
import type { AkunKas, PlafonLog } from "../lib/types";

/**
 * Ubah plafon kas kecil/kas iklan + riwayat perubahannya (AB-KI-5, KP-KI-3). Naik: isi ulang Selasa berikutnya menambah
 * selisihnya. Turun: kelebihan dikembalikan ke Kas utama (kas iklan: tombol "Kembalikan kelebihan").
 */
export default function UbahPlafon({ akun }: { akun: AkunKas }) {
  const [buka, setBuka] = useState(false);
  const [nilai, setNilai] = useState("");
  const [alasan, setAlasan] = useState("");
  const aksi = useAksi();
  const logQ = useQuery({ queryKey: ["plafon-log", akun.id], enabled: buka, queryFn: () => api<PlafonLog[]>(`/akun-kas/${akun.id}/plafon-log`) });
  if (!buka)
    return (
      <Button variant="pinggir" kecil onClick={() => setBuka(true)}>
        Ubah plafon
      </Button>
    );
  return (
    <Flex vertical gap="small" style={{ width: "100%" }} data-ubah-plafon>
      <Flex gap="small" wrap align="flex-end">
        <Field label="Plafon baru (Rp)">
          <Input aria-label="Plafon baru" inputMode="numeric" value={nilai} placeholder={String(Math.round(Number(akun.plafon ?? 0)))} onChange={(e) => setNilai(e.target.value)} />
        </Field>
        <Field label="Alasan">
          <Input aria-label="Alasan plafon" value={alasan} onChange={(e) => setAlasan(e.target.value)} />
        </Field>
      </Flex>
      <Flex gap="small">
        <Button
          kecil
          disabled={!bersihkanAngka(nilai) || aksi.isPending}
          onClick={() => aksi.mutate({ path: `/akun-kas/${akun.id}/plafon`, method: "PUT", body: { plafon: bersihkanAngka(nilai), alasan } }, { onSuccess: () => setNilai("") })}
        >
          Simpan plafon
        </Button>
        <Button variant="pinggir" kecil onClick={() => setBuka(false)}>
          Tutup
        </Button>
      </Flex>
      <ErrorBox error={aksi.error ?? logQ.error} />
      {(logQ.data ?? []).map((l) => (
        <Typography.Text key={l.id} type="secondary" style={{ fontSize: 12 }}>
          {tanggal(l.tanggal)}: {rp(l.dari)} → {rp(l.ke)}
          {l.alasan ? ` (${l.alasan})` : ""}
        </Typography.Text>
      ))}
    </Flex>
  );
}
