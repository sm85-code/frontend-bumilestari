import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Segmented } from "antd";
import { useMemo, useState, type FormEvent } from "react";
import { Button, ErrorBox, Field, Input, Select } from "./ui";
import { api } from "../lib/api";
import { bersihkanAngka, hariIni, rp } from "../lib/format";
import type { AkunKas, Kategori, Transaksi, TransaksiIn } from "../lib/types";

interface Props {
  akun: AkunKas[];
  kategori: Kategori[];
  /** Kunci jenis transaksi (mis. staf hanya pengeluaran). */
  jenisTetap?: "masuk" | "keluar";
  akunAwal?: string;
  onSukses?: () => void;
}

export default function FormTransaksi({ akun, kategori, jenisTetap, akunAwal, onSukses }: Props) {
  const qc = useQueryClient();
  const [akunId, setAkunId] = useState(akunAwal ?? akun[0]?.id ?? "");
  const [jenis, setJenis] = useState<"masuk" | "keluar">(jenisTetap ?? "keluar");
  const [kategoriId, setKategoriId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tgl, setTgl] = useState(hariIni());

  const pilihan = useMemo(
    () => kategori.filter((k) => k.jenis === (jenis === "masuk" ? "pemasukan" : "pengeluaran")),
    [kategori, jenis],
  );
  const kategoriAktif = pilihan.some((k) => k.id === kategoriId) ? kategoriId : (pilihan[0]?.id ?? "");

  const simpan = useMutation({
    mutationFn: (body: TransaksiIn) => api<Transaksi>("/transaksi", { body }),
    onSuccess: () => {
      setJumlah("");
      setKeterangan("");
      void qc.invalidateQueries();
      onSukses?.();
    },
  });

  function kirim(e: FormEvent) {
    e.preventDefault();
    simpan.mutate({
      tanggal: tgl,
      akun_id: akunId,
      kategori_id: kategoriAktif,
      jenis,
      jumlah: bersihkanAngka(jumlah),
      keterangan: keterangan.trim(),
    });
  }

  return (
    <form onSubmit={kirim} className="space-y-3">
      {akun.length > 1 && (
        <Field label="Akun">
          <Select value={akunId} onChange={(e) => setAkunId(e.target.value)}>
            {akun.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nama} ({rp(a.saldo)})
              </option>
            ))}
          </Select>
        </Field>
      )}
      {!jenisTetap && (
        <Segmented
          block
          size="large"
          value={jenis}
          onChange={(v) => setJenis(v as "keluar" | "masuk")}
          options={[
            { label: "Pengeluaran", value: "keluar" },
            { label: "Pemasukan", value: "masuk" },
          ]}
          aria-label="Jenis transaksi"
        />
      )}
      <Field label="Kategori">
        <Select value={kategoriAktif} onChange={(e) => setKategoriId(e.target.value)} required>
          {pilihan.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Jumlah (Rp)" hint={jumlah ? rp(bersihkanAngka(jumlah)) : undefined}>
        <Input inputMode="numeric" required placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
      </Field>
      <Field label="Keterangan">
        <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="mis. beli lakban" />
      </Field>
      <Field label="Tanggal">
        <Input type="date" required value={tgl} onChange={(e) => setTgl(e.target.value)} />
      </Field>
      <ErrorBox error={simpan.error} />
      <Button type="submit" disabled={simpan.isPending || !akunId || !kategoriAktif || !jumlah} className="w-full">
        {simpan.isPending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
