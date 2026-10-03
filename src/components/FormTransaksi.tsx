import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button as AButton, Form, Segmented, Typography } from "antd";
import { useMemo, useState } from "react";
import { AksiForm, Button, Field, Formulir, Input, InputTanggal, Select, useDialog } from "./ui";
import { useAuth } from "../auth/AuthContext";
import { api, isSetoranKedua } from "../lib/api";
import { bersihkanAngka, bulanTahun, hariIni, rp } from "../lib/format";
import { labelKategori, pilihanKategori } from "../lib/kategori";
import { kekuranganSaldo, useNamaTalangan } from "../lib/talangan";
import { bulanTertutup, useDaftarTutupBuku } from "../lib/tutupBuku";
import type { AkunKas, Kategori, Transaksi, TransaksiIn } from "../lib/types";

interface Props {
  akun: AkunKas[];
  kategori: Kategori[];
  /** Kunci jenis transaksi (mis. staf hanya pengeluaran). */
  jenisTetap?: "masuk" | "keluar";
  akunAwal?: string;
  /** Staf: hanya 4 kategori kas kecil. */
  staf?: boolean;
  /** Kategori sebagai tombol besar (layar kas kecil), bukan daftar pilihan. */
  tombolKategori?: boolean;
  onSukses?: () => void;
}

/**
 * Form transaksi manual. Kategori sengaja TIDAK punya nilai bawaan (wajib dipilih) dan kategori sistem
 * (bagi hasil, gaji, biaya produksi, tagihan rutin, penjualan penjual lain) tidak ditawarkan: transaksi itu
 * dibuat otomatis dari halaman asalnya. Aturan daftar ada di `lib/kategori.ts`.
 */
export default function FormTransaksi({ akun, kategori, jenisTetap, akunAwal, staf, tombolKategori, onSukses }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const { konfirmasi } = useDialog();
  const [akunId, setAkunId] = useState(akunAwal ?? akun[0]?.id ?? "");
  const [jenis, setJenis] = useState<"masuk" | "keluar">(jenisTetap ?? "keluar");
  const [kategoriId, setKategoriId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tgl, setTgl] = useState(hariIni());
  const [koreksi, setKoreksi] = useState("");
  const [talangan, setTalangan] = useState(user?.nama ?? "");
  // Koreksi atas bulan yang sudah tutup buku (dicatat di bulan berjalan); staf tidak mengurus tutup buku.
  const tertutup = bulanTertutup(useDaftarTutupBuku(!staf).data);
  const akunPilih = akun.find((a) => a.id === akunId);

  const pilihan = useMemo(() => pilihanKategori(kategori, { jenis, staf, admin, akun: akunPilih }), [kategori, jenis, staf, admin, akunPilih]);
  // Ganti akun/jenis: kategori yang tidak ada lagi di daftar dianggap belum dipilih.
  const kategoriAktif = pilihan.some((k) => k.id === kategoriId) ? kategoriId : "";
  // Saldo kas kecil/kas iklan kurang: kekurangannya dicatat sebagai talangan oleh seseorang (spesifikasi 8.8).
  const kurang = kekuranganSaldo(akunPilih, jenis, Number(bersihkanAngka(jumlah) || 0));
  const namaQ = useNamaTalangan(kurang > 0);

  const simpan = useMutation({
    mutationFn: async (body: TransaksiIn) => {
      try {
        return await api<Transaksi>("/transaksi", { body });
      } catch (e) {
        // Setoran modal kedua (aturan 8.x): backend minta konfirmasi eksplisit admin.
        if (!isSetoranKedua(e)) throw e;
        const ok = await konfirmasi("Setoran modal sudah pernah dicatat", {
          teks: `Setoran awal sudah ada. Catat ${rp(body.jumlah)} ini sebagai setoran modal TAMBAHAN dari pemilik?`,
          ok: "Ya, setoran tambahan",
        });
        if (!ok) throw e;
        return api<Transaksi>("/transaksi", { body: { ...body, konfirmasi_setoran_modal_kedua: true } });
      }
    },
    onSuccess: () => {
      setJumlah("");
      setKeterangan("");
      setKategoriId("");
      setKoreksi("");
      void qc.invalidateQueries();
      onSukses?.();
    },
  });

  function kirim() {
    if (!kategoriAktif) return;
    simpan.mutate({
      tanggal: tgl,
      akun_id: akunId,
      kategori_id: kategoriAktif,
      jenis,
      jumlah: bersihkanAngka(jumlah),
      keterangan: keterangan.trim(),
      koreksi_periode: koreksi || null,
      talangan_oleh: kurang > 0 ? talangan.trim() : null,
    });
  }

  return (
    <Formulir onKirim={kirim}>
      {akun.length > 1 && (
        <Field label="Akun kas">
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
        <Form.Item>
          <Segmented
            block
            value={jenis}
            onChange={(v) => setJenis(v as "keluar" | "masuk")}
            options={[
              { label: "Pengeluaran", value: "keluar" },
              { label: "Pemasukan", value: "masuk" },
            ]}
            aria-label="Jenis transaksi"
          />
        </Form.Item>
      )}
      {tombolKategori ? (
        <Form.Item label="Kategori" required labelCol={{ span: 24 }}>
          <div role="radiogroup" aria-label="Kategori" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {pilihan.map((k) => {
              const on = k.id === kategoriAktif;
              return (
                <AButton
                  key={k.id}
                  role="radio"
                  aria-checked={on}
                  size="large"
                  type={on ? "primary" : "default"}
                  onClick={() => setKategoriId(k.id)}
                  style={{ height: 52, fontWeight: 600 }}
                >
                  {labelKategori(k.nama)}
                </AButton>
              );
            })}
          </div>
          {pilihan.length === 0 && <Typography.Text type="danger">Kategori kas kecil belum tersedia. Hubungi admin.</Typography.Text>}
        </Form.Item>
      ) : (
        <Field label="Kategori">
          <Select aria-label="Kategori" placeholder="Pilih kategori" value={kategoriAktif} onChange={(e) => setKategoriId(e.target.value)} required>
            {pilihan.map((k) => (
              <option key={k.id} value={k.id}>
                {labelKategori(k.nama)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Jumlah (Rp)" hint={jumlah ? rp(bersihkanAngka(jumlah)) : undefined}>
        <Input inputMode="numeric" required placeholder="0" aria-label="Jumlah" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
      </Field>
      <Field label="Keterangan">
        <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="mis. lakban 5 gulung" />
      </Field>
      <Field label="Tanggal" hint="Lupa mencatat kemarin? Pilih tanggal kemarin.">
        <InputTanggal value={tgl} onChange={setTgl} />
      </Field>
      {kurang > 0 && (
        <div data-talangan>
          <Typography.Paragraph type="warning" style={{ marginBottom: 8 }}>
            Saldo {akunPilih?.nama.toLowerCase()} kurang {rp(kurang)}. Kekurangan ini dicatat sebagai talangan (uang pribadi yang nanti diganti dari Kas utama saat Tutup Kas
            Mingguan).
          </Typography.Paragraph>
          <Field label="Talangan oleh">
            <Input aria-label="Talangan oleh" list="daftar-nama-talangan" required value={talangan} onChange={(e) => setTalangan(e.target.value)} placeholder="Nama yang memakai uang pribadi" />
          </Field>
          <datalist id="daftar-nama-talangan">
            {(namaQ.data ?? []).map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      )}
      {!staf && tertutup.length > 0 && (
        <Field label="Koreksi bulan lalu (opsional)" hint="Untuk membetulkan bulan yang sudah tutup buku. Tetap dicatat & dihitung di bulan ini.">
          <Select aria-label="Koreksi bulan lalu" value={koreksi} onChange={(e) => setKoreksi(e.target.value)}>
            <option value="">Bukan koreksi</option>
            {tertutup.map((p) => (
              <option key={p} value={p}>
                Koreksi {bulanTahun(p)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <AksiForm error={simpan.error}>
        {!kategoriAktif && <Typography.Text type="secondary">Pilih kategori dulu.</Typography.Text>}
        <Button type="submit" disabled={simpan.isPending || !akunId || !kategoriAktif || !bersihkanAngka(jumlah) || (kurang > 0 && talangan.trim().length < 2)} penuh>
          {simpan.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </AksiForm>
    </Formulir>
  );
}
