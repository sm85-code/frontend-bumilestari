import type { ThemeConfig } from "antd";

/** Warna dasar (hex, karena antd memakai hex). Hijau mengikuti logo; abu kebiruan mengikuti erp.ampelkuning.com. */
export const WARNA = {
  hijau: "#197037",
  hijauTua: "#085023",
  hijauMuda: "#d9fae4",
  latar: "#f5f8fc",
  garis: "#dde2e6",
  tinta: "#101820",
  redup: "#59656e",
  kepala: "#eff2f6",
  oranye: "#f09c17",
};

export const FONT = '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const tema: ThemeConfig = {
  token: {
    colorPrimary: WARNA.hijau,
    colorLink: WARNA.hijau,
    colorLinkHover: WARNA.hijauTua,
    colorSuccess: "#2e8b4e",
    colorWarning: WARNA.oranye,
    colorError: "#d03a3a",
    colorInfo: "#2f7bb7",
    colorTextBase: WARNA.tinta,
    colorTextSecondary: WARNA.redup,
    colorBgLayout: WARNA.latar,
    colorBorder: WARNA.garis,
    colorBorderSecondary: WARNA.garis,
    fontFamily: FONT,
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: 16,
    controlHeight: 40,
    boxShadowTertiary: "0 1px 2px 0 rgba(16,24,32,0.04), 0 2px 8px -2px rgba(16,24,32,0.06)",
  },
  components: {
    Card: { bodyPadding: 16, headerPadding: 16, headerFontSize: 14 },
    Table: { headerBg: WARNA.kepala, headerColor: WARNA.redup, headerSplitColor: "transparent", rowHoverBg: "#f7faf8", cellPaddingBlock: 10, cellPaddingInline: 12, borderColor: WARNA.garis },
    Menu: { itemBorderRadius: 10, itemSelectedBg: WARNA.hijauMuda, itemSelectedColor: WARNA.hijau, itemHeight: 42 },
    Button: { fontWeight: 600 },
    Tabs: { titleFontSize: 14 },
    Typography: { titleMarginBottom: 0 },
  },
};
