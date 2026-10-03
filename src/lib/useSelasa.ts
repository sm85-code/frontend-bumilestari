import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { api, query } from "./api";
import { useAkun } from "./data";
import { num } from "./format";
import { LANGKAH_AKTIF, bacaTanda, selasaAcuan, selesaiOtomatis, simpanTanda, statusLangkah, tambahHari, type IdLangkah, type StatusLangkah, type TandaManual } from "./selasa";
import type { Invoice, PengisianImprest, PiutangPelanggan, SiapBayar, Sisihan, Transfer } from "./types";

/** Data & status semua langkah Tutup Kas Mingguan untuk Selasa acuan dari `tgl`. Dipakai halaman Tutup Kas Mingguan dan Beranda. */
export function useSelasa(tgl: string, admin: boolean, aktif = true) {
  const selasa = selasaAcuan(tgl);
  const akunQ = useAkun();
  const invoiceQ = useQuery({ queryKey: ["invoice", selasa], enabled: aktif, queryFn: () => api<Invoice[]>(`/invoice-reseller${query({ tanggal: selasa })}`) });
  const piutangQ = useQuery({ queryKey: ["piutang"], enabled: aktif, queryFn: () => api<PiutangPelanggan[]>("/piutang-reseller") });
  const transferQ = useQuery({
    queryKey: ["transfer", "minggu", selasa],
    enabled: aktif,
    queryFn: () => api<Transfer[]>(`/transfer${query({ dari: selasa, sampai: tambahHari(selasa, 6) })}`),
  });
  const siapQ = useQuery({ queryKey: ["siap-bayar", selasa], enabled: aktif, queryFn: () => api<SiapBayar>(`/pembayaran-pemasok/siap${query({ tanggal: selasa })}`) });
  const sisihanQ = useQuery({ queryKey: ["sisihan", selasa], enabled: aktif, queryFn: () => api<Sisihan>(`/sisihan/hitung${query({ tanggal: selasa })}`) });
  const kasKecilQ = useQuery({ queryKey: ["pengisian", "kas-kecil"], enabled: aktif, queryFn: () => api<PengisianImprest>("/kas-kecil/pengisian") });
  const kasIklanQ = useQuery({ queryKey: ["pengisian", "kas-iklan"], enabled: aktif && admin, queryFn: () => api<PengisianImprest>("/kas-iklan/pengisian") });

  const [tanda, setTanda] = useState<TandaManual>(() => bacaTanda(selasa));
  useEffect(() => setTanda(bacaTanda(selasa)), [selasa]);

  const otomatis = useMemo(
    () =>
      selesaiOtomatis({
        selasa,
        akun: akunQ.data,
        invoice: invoiceQ.data,
        transfer: transferQ.data,
        siap: siapQ.data,
        sisihan: sisihanQ.data,
        isiKasKecil: kasKecilQ.data,
        // Kas iklan khusus admin; bila gagal dimuat (mis. akun belum ada) jangan menahan langkah.
        isiKasIklan: admin && !kasIklanQ.isError ? kasIklanQ.data : undefined,
      }),
    [selasa, akunQ.data, invoiceQ.data, transferQ.data, siapQ.data, sisihanQ.data, kasKecilQ.data, kasIklanQ.data, kasIklanQ.isError, admin],
  );
  const status = Object.fromEntries(LANGKAH_AKTIF.map((l) => [l.id, statusLangkah(l.id, otomatis, tanda)])) as Record<IdLangkah, StatusLangkah>;
  const selesai = LANGKAH_AKTIF.filter((l) => status[l.id] === "selesai").length;
  const beres = LANGKAH_AKTIF.filter((l) => status[l.id] !== "belum").length;

  return {
    selasa,
    akunQ,
    invoiceQ,
    piutangQ,
    transferQ,
    siapQ,
    sisihanQ,
    kasKecilQ,
    kasIklanQ,
    otomatis,
    status,
    selesai,
    beres,
    total: LANGKAH_AKTIF.length,
    tagihanSelasaIni: (invoiceQ.data ?? []).reduce((t, i) => t + num(i.grand_total), 0),
    semuaBelumDibayar: (piutangQ.data ?? []).reduce((t, p) => t + num(p.subtotal), 0),
    tandai: (id: IdLangkah, s: Exclude<StatusLangkah, "belum"> | null) => setTanda(simpanTanda(selasa, id, s)),
  };
}
