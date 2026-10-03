import type { ThemeConfig } from "antd";

/** Warna diambil dari logo Bumi Lestari: hijau daun, oranye matahari, coklat gunung. Selebihnya default Ant Design. */
export const WARNA = {
  hijau: "#386c20",
  oranye: "#fda800",
  coklat: "#655e54",
};

/** Hijau logo cukup gelap; turunan otomatis antd untuk latar jadi abu-abu kehijauan. Tentukan versi mudanya agar jelas terbaca. */
const HIJAU_MUDA = { bg: "#eaf2e5", bgHover: "#dbe8d3", border: "#b7cfa9" };

export const tema: ThemeConfig = {
  token: {
    colorPrimary: WARNA.hijau,
    colorLink: WARNA.hijau,
    colorSuccess: WARNA.hijau,
    colorWarning: WARNA.oranye,
    colorInfo: WARNA.hijau,
    colorPrimaryBg: HIJAU_MUDA.bg,
    colorPrimaryBgHover: HIJAU_MUDA.bgHover,
    colorPrimaryBorder: HIJAU_MUDA.border,
    colorSuccessBg: HIJAU_MUDA.bg,
    colorSuccessBgHover: HIJAU_MUDA.bgHover,
    colorSuccessBorder: HIJAU_MUDA.border,
    colorInfoBg: HIJAU_MUDA.bg,
    colorInfoBgHover: HIJAU_MUDA.bgHover,
    colorInfoBorder: HIJAU_MUDA.border,
  },
};
