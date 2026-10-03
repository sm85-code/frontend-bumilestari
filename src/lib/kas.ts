import { num } from "./format";
import type { AkunKas } from "./types";

/** Saldo kas kecil / kas iklan di bawah 20% plafon dianggap rendah (AB-TL-4). */
export function saldoRendah(saldo: number, plafon: number): boolean {
  return plafon > 0 && saldo < plafon * 0.2;
}

export const KODE_DANA_CADANGAN = "DANA_CADANGAN";

/**
 * Pisahkan kas yang bisa dipakai dari Dana cadangan (sisihan gaji, bukan untuk belanja).
 * `total` = total_kas dari dashboard (sudah sesuai hak akses: kas iklan hanya untuk admin).
 */
export function pisahKas(total: string | number, akun: Pick<AkunKas, "kode" | "saldo">[]): { bisaDipakai: number; cadangan: number } {
  const cadangan = akun.filter((a) => a.kode === KODE_DANA_CADANGAN).reduce((t, a) => t + num(a.saldo), 0);
  return { bisaDipakai: num(total) - cadangan, cadangan };
}
