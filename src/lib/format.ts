/** Angka dari API datang sebagai string desimal ("1000000.00"). */
export function num(nilai: string | number | null | undefined): number {
  if (nilai === null || nilai === undefined || nilai === "") return 0;
  return typeof nilai === "number" ? nilai : Number(nilai);
}

/** 1225000 -> "Rp1.225.000" */
export function rp(nilai: string | number | null | undefined): string {
  const n = Math.round(num(nilai));
  const sign = n < 0 ? "-" : "";
  return `${sign}Rp${Math.abs(n).toLocaleString("id-ID")}`;
}

/** "2026-09-26" -> "26/09/2026" */
export function tanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export function tanggalHari(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${tanggal(iso)} - ${HARI[new Date(y, m - 1, d).getDay()]}`;
}

/** Tanggal lokal hari ini sebagai YYYY-MM-DD (bukan UTC). */
export function hariIni(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function bulanIni(): string {
  return hariIni().slice(0, 7);
}

/** Angka hasil ketikan ("1.500.000", "1500000") -> "1500000" untuk dikirim ke API. */
export function bersihkanAngka(teks: string): string {
  return teks.replace(/[^\d]/g, "");
}
