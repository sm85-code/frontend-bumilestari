const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const PREFIX = `${BASE}/api/bumi-lestari`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** FastAPI mengirim {detail: "teks"} atau {detail: [{msg, loc}, ...]} untuk validasi. */
function pesanError(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const d = detail[0] as { msg?: string; loc?: unknown[] };
    const kolom = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : undefined;
    return kolom ? `${String(kolom)}: ${d.msg ?? "tidak valid"}` : (d.msg ?? "Data tidak valid");
  }
  if (status === 401) return "Sesi habis, silakan masuk lagi";
  if (status === 403) return "Akses ditolak";
  return `Terjadi kesalahan (${status})`;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${PREFIX}${path}`, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    credentials: "include",
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
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
