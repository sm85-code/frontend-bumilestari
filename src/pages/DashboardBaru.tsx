import { Link } from "react-router-dom";
import { Card, PageHeader } from "../components/ui";

export default function DashboardBaru() {
  return (
    <>
      <PageHeader judul="Dashboard" sub="Senin–Sabtu dihitung. Selasa dikunci. Shopee dari ERP. Toko web dan marketplace lain manual." />
      <Card judul="Urutan kerja">
        <ol>
          <li>Tarik order dari ERP.</li>
          <li>Petakan nama barang ke jenis. Kayu atau non-kayu.</li>
          <li>Kayu: tukang, lalu karyawan cat. Non-kayu: supplier, tanpa cat.</li>
          <li>Tarik pencairan. Toko web diisi manual.</li>
          <li>Setelah gaji dibayar, bagi hasil 40% admin dan 60% owner.</li>
        </ol>
        <p>
          <Link to="/pencairan/erp">Tarik order</Link>
          {" · "}
          <Link to="/order/peta">Petakan barang</Link>
          {" · "}
          <Link to="/order">Order</Link>
          {" · "}
          <Link to="/produksi">Produksi</Link>
          {" · "}
          <Link to="/pencairan">Pencairan</Link>
        </p>
      </Card>
      <Card judul="Bukan wizard 8 langkah">
        Tutup kas mingguan yang lama tidak dipakai lagi. Laporan tetap dikirim manual setelah angka minggu itu lengkap.
      </Card>
    </>
  );
}
