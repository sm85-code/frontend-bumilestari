const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const PREFIX = `${BASE}/api/bumi-lestari`;

/** URL lengkap endpoint (untuk tautan unduh PDF). */
export const apiUrl = (path: string) => `${PREFIX}${path}`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const KOLOM: Record<string, string> = {
  jumlah: "Jumlah",
  tanggal: "Tanggal",
  kategori_id: "Kategori",
  akun_id: "Akun kas",
  keterangan: "Keterangan",
  alasan: "Alasan",
  periode: "Periode",
  email: "Email",
  password: "Kata sandi",
  new_password: "Kata sandi baru",
  current_password: "Kata sandi saat ini",
};

/** Pesan validasi pydantic (bahasa Inggris) -> bahasa sehari-hari. */
function terjemahValidasi(msg: string | undefined): string {
  if (!msg) return "tidak valid";
  if (/field required/i.test(msg)) return "wajib diisi";
  if (/greater than 0/i.test(msg)) return "harus lebih dari 0";
  if (/greater than or equal to 0/i.test(msg)) return "tidak boleh minus";
  if (/valid date/i.test(msg)) return "tanggal tidak valid";
  if (/valid number|valid decimal/i.test(msg)) return "harus berupa angka";
  if (/at least (\d+) character/i.test(msg)) return `minimal ${msg.match(/at least (\d+)/i)?.[1]} karakter`;
  if (/valid email/i.test(msg)) return "email tidak valid";
  if (/^value error, /i.test(msg)) return msg.replace(/^value error, /i, "");
  return msg;
}

export const PESAN_BELUM_SIAP = "Aplikasi belum siap dipakai. Hubungi admin.";

const PESAN_TETAP: Record<string, string> = {
  "Email atau password salah": "Email atau kata sandi salah.",
  "Akun dinonaktifkan": "Akun Anda dinonaktifkan. Hubungi admin.",
  "Akses ditolak": "Anda tidak punya akses untuk ini. Hubungi admin bila perlu.",
  "Tidak terautentikasi": "Sesi habis, silakan masuk lagi.",
  "Sesi tidak valid": "Sesi habis, silakan masuk lagi.",
};

/**
 * Ubah pesan teknis dari backend menjadi pesan ramah tanpa istilah teknis (mis. "seed-now"), agar staf tidak bingung.
 * FastAPI mengirim {detail: "teks"} atau {detail: [{msg, loc}, ...]} untuk validasi.
 */
export function pesanError(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") {
    if (/seed-now|seed now|belum dibuat|belum ada \(jalankan/i.test(detail)) return PESAN_BELUM_SIAP;
    if (PESAN_TETAP[detail]) return PESAN_TETAP[detail];
    const saldo = detail.match(/^Saldo (.+?) tidak cukup/);
    if (saldo) return `Saldo ${saldo[1]} tidak cukup untuk jumlah ini. Periksa jumlahnya atau hubungi admin.`;
    if (status === 403 && /hanya/i.test(detail)) return `${detail}. Hubungi admin bila perlu.`;
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const d = detail[0] as { msg?: string; loc?: unknown[] };
    const kolom = Array.isArray(d.loc) ? String(d.loc[d.loc.length - 1]) : undefined;
    const pesan = terjemahValidasi(d.msg);
    return kolom && kolom !== "body" ? `${KOLOM[kolom] ?? kolom}: ${pesan}` : pesan;
  }
  if (status === 401) return "Sesi habis, silakan masuk lagi.";
  if (status === 403) return "Anda tidak punya akses untuk ini. Hubungi admin bila perlu.";
  if (status === 404) return "Data tidak ditemukan. Muat ulang halaman lalu coba lagi.";
  if (status >= 500) return "Server sedang bermasalah. Coba lagi sebentar lagi; bila berulang, hubungi admin.";
  return `Terjadi kesalahan (${status}). Coba lagi; bila berulang, hubungi admin.`;
}

export const PESAN_OFFLINE = "Tidak bisa terhubung ke server. Periksa internet lalu coba lagi.";

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${PREFIX}${path}`, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      credentials: "include",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, PESAN_OFFLINE);
  }
  const teks = await res.text();
  const body = teks ? safeJson(teks) : null;
  if (!res.ok) throw new ApiError(res.status, pesanError(body, res.status));
  return body as T;
}

function safeJson(teks: string): unknown {
  try {
    return JSON.parse(teks);
  } catch {
    return null;
  }
}

export function query(params: Record<string, string | number | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
