import { useQuery } from "@tanstack/react-query";
import { api, query } from "./api";
import type { BudgetIklan, PlatformIklan } from "./types";

export const LABEL_GRUP = { internal: "Internal marketplace", eksternal: "Eksternal (Meta, Google, …)" } as const;

export const usePlatformIklan = (aktif = true) => useQuery({ queryKey: ["platform-iklan"], enabled: aktif, queryFn: () => api<PlatformIklan[]>("/platform-iklan") });

export const useBudgetIklan = (tanggal: string, aktif = true) =>
  useQuery({ queryKey: ["budget-iklan", tanggal.slice(0, 7)], enabled: aktif, queryFn: () => api<BudgetIklan>(`/kas-iklan/sisa-budget${query({ tanggal })}`) });
