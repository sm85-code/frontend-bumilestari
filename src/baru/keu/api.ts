import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "../../lib/api";
import type { Page } from "./types";

export const keu = <T,>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}) => api<T>(`/keu${path}`, init);
export function useResource<T>(path: string, offset = 0, search = "", status?: "pengerjaan" | "batal" | "semua") {
  return useQuery({ queryKey: ["keu", path, offset, search, status], queryFn: ({ signal }) => keu<Page<T>>(`${path}${query({ limit: 50, offset, search, status })}`, { signal }) });
}
export function useChoices<T>(path: string) {
  return useQuery({ queryKey: ["keu", "choices", path], queryFn: async ({ signal }) => {
    const result: T[] = [];
    let offset = 0;
    while (true) {
      const page = await keu<Page<T>>(`${path}${query({ limit: 200, offset })}`, { signal });
      result.push(...page.rows);
      if (offset + page.rows.length >= page.total || !page.rows.length) return result;
      offset += page.rows.length;
    }
  } });
}
export function useKeuAction<T = unknown>() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ path, body, method }: { path: string; body?: unknown; method?: string }) => keu<T>(path, { body, method: method ?? "POST" }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["keu"] }); } });
}
export function money(value: string | number | undefined) {
  if (value === undefined || value === "") return "—";
  const match = String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return "—";
  const fraction = (match[3] ?? "").padEnd(2, "0").slice(0, 2);
  return `${match[1]}Rp ${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
}
export function multiplyMoney(value: string, qty: number) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || !Number.isSafeInteger(qty) || qty < 1) throw new Error("Isi harga dengan angka dan kuantitas bilangan bulat positif.");
  const [whole, fraction = ""] = value.split(".");
  const total = (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * BigInt(qty);
  return `${total / 100n}.${String(total % 100n).padStart(2, "0")}`;
}
export function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
