import { Modal, Typography } from "antd";
import { useCallback, useState } from "react";

const KUNCI = (userId: string) => `bl-panduan-staf-v1:${userId}`;

function sudahDibaca(userId: string | undefined): boolean {
  if (!userId) return true;
  try {
    return window.localStorage.getItem(KUNCI(userId)) === "1";
  } catch {
    return true; // localStorage diblokir: jangan ganggu dengan panduan berulang
  }
}

/** Panduan hari pertama staf (Bagian 12): tampil otomatis sekali per pengguna, disimpan di localStorage. */
export function usePanduanStaf(userId: string | undefined, aktif: boolean) {
  const [buka, setBuka] = useState(() => aktif && !sudahDibaca(userId));
  const tutup = useCallback(() => {
    if (userId) {
      try {
        window.localStorage.setItem(KUNCI(userId), "1");
      } catch {
        /* abaikan */
      }
    }
    setBuka(false);
  }, [userId]);
  return { buka, tutup, tampilkan: () => setBuka(true) };
}

export function PanduanStaf({ buka, onTutup }: { buka: boolean; onTutup: () => void }) {
  return (
    <Modal open={buka} title="Selamat datang!" onCancel={onTutup} onOk={onTutup} okText="Mengerti" cancelButtonProps={{ style: { display: "none" } }} centered width={560}>
      <Typography.Paragraph strong>Tugas kamu di aplikasi ini hanya satu: mencatat uang kas kecil yang kamu pakai.</Typography.Paragraph>
      <ol style={{ paddingInlineStart: 20, margin: 0, display: "grid", gap: 6 }}>
        <li>
          Di atas terlihat <b>sisa uang kas kecil</b>.
        </li>
        <li>
          Setiap kali memakai uang kas kecil, isi <b>Catat pengeluaran</b>: pilih <b>kategori</b> — <i>Transport</i> (ongkos, bensin, ojek),{" "}
          <i>Packing</i> (kardus, lakban, plastik), <i>Operasional</i> (keperluan kerja lain), atau <i>Lainnya</i> — lalu isi <b>jumlah</b>,{" "}
          <b>tanggal</b> (lupa mencatat kemarin? pilih tanggal kemarin), dan <b>keterangan</b> singkat, misalnya "lakban 5 gulung". Tekan{" "}
          <b>Simpan</b>.
        </li>
        <li>Simpan nota/struk, dan foto bila diminta admin.</li>
        <li>
          <b>Uang kurang?</b> Hubungi admin sebelum belanja; aplikasi tidak bisa mencatat pengeluaran melebihi sisa kas kecil.
        </li>
        <li>
          <b>Salah catat?</b> Kamu tidak bisa menghapus sendiri. <b>Minta admin membatalkan</b>, lalu catat ulang yang benar.
        </li>
        <li>
          Lihat catatanmu di <b>Riwayat bulan ini</b>.
        </li>
        <li>Setiap Selasa admin mengisi lagi kas kecil sampai plafon. Setiap awal bulan admin menghitung uang tunai bersama kamu.</li>
      </ol>
      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
        Ada masalah atau pesan error? Hubungi admin. Panduan ini bisa dibuka lagi dari Profil saya.
      </Typography.Paragraph>
    </Modal>
  );
}
