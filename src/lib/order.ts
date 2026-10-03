import type { Order, Produk, StatusOrder } from "./types";

export const LABEL_STATUS: Record<StatusOrder, string> = {
  dipesan: "Dipesan",
  dikerjakan: "Dikerjakan tukang",
  diambil: "Diambil dari tukang",
  diterima: "Diterima dari supplier",
  dicat: "Dicat",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

/** Alur status sesuai backend: kayu (dengan/tanpa cat) berbeda dari non kayu. */
export function alurStatus(jenisProduk: Produk["jenis_produk"], butuhCat: boolean): StatusOrder[] {
  if (jenisProduk === "non_kayu") return ["dipesan", "diterima", "dikirim", "selesai"];
  return butuhCat
    ? ["dipesan", "dikerjakan", "diambil", "dicat", "dikirim", "selesai"]
    : ["dipesan", "dikerjakan", "diambil", "dikirim", "selesai"];
}

/** Status berikutnya, atau null bila sudah selesai/batal. */
export function statusBerikut(order: Pick<Order, "status" | "butuh_cat">, jenisProduk: Produk["jenis_produk"]): StatusOrder | null {
  if (order.status === "selesai" || order.status === "batal") return null;
  const alur = alurStatus(jenisProduk, order.butuh_cat);
  const i = alur.indexOf(order.status);
  return i >= 0 && i < alur.length - 1 ? alur[i + 1] : null;
}
