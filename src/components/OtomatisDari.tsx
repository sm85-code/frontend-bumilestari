import { Typography } from "antd";
import { Link } from "react-router-dom";
import type { Sumber } from "../lib/sumber";

/** Pengganti tombol "Batalkan" untuk transaksi/transfer otomatis: arahkan ke halaman asalnya. */
export function OtomatisDari({ sumber }: { sumber: Sumber }) {
  return (
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      Otomatis dari {sumber.ke ? <Link to={sumber.ke}>{sumber.label}</Link> : sumber.label}
      <br />
      Batalkan dari halaman asal.
    </Typography.Text>
  );
}
