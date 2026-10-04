import { Link } from "react-router-dom";
import { Card, PageHeader } from "../components/ui";

const tautan = [
  ["Order kayu", "/order", "Setelah tukang selesai, karyawan cat mengubah status."],
  ["Order non-kayu", "/order", "Barang supplier, tanpa cat. Karyawan non-kayu packing."],
  ["Bayar tukang & supplier", "/pesanan-tukang", "Harga tukang satu tagihan. Non-kayu harga supplier."],
];

export default function ProduksiPage() {
  return (
    <>
      <PageHeader judul="Produksi" sub="Kerja fisik. Status di sini tidak dikirim balik ke Shopee." />
      {tautan.map(([judul, ke, sub]) => (
        <Card key={judul} judul={judul} aksi={<Link to={ke}>Buka</Link>}>{sub}</Card>
      ))}
    </>
  );
}
