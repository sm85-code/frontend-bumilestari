import type { Order, Produk, Saluran, StatusOrder } from "./types";

export const LABEL_STATUS: Record<StatusOrder, string> = {
  dipesan: "Dipesan",
  dikerjakan: "Dikerjakan tukang",
  diambil: "Diambil dari tukang",
  diterima: "Diterima dari supplier",
  dicat: "Dicat",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
  retur: "Retur",
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
  if (order.status === "selesai" || order.status === "batal" || order.status === "retur") return null;
  const alur = alurStatus(jenisProduk, order.butuh_cat);
  const i = alur.indexOf(order.status);
  return i >= 0 && i < alur.length - 1 ? alur[i + 1] : null;
}

/** Order marketplace/Toko web: uangnya datang lewat pencairan (status cair). */
export const salurCair = (s: Pick<Saluran, "jenis"> | undefined) => s?.jenis === "marketplace" || s?.jenis === "web";

/** Retur sebelum cair (AB-BC-3): order marketplace/Toko web yang sudah dikirim dan belum cair. Sesudah cair → lewat file pencairan. */
export function bolehRetur(order: Pick<Order, "status" | "status_cair">, saluran: Pick<Saluran, "jenis"> | undefined): boolean {
  return salurCair(saluran) && (order.status === "dikirim" || order.status === "selesai") && order.status_cair !== "cair";
}
