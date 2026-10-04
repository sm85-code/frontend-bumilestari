import { Link } from "react-router-dom";
import { Card, PageHeader } from "../components/ui";

const tautan = [
  ["/master", "Katalog", "Jenis barang, kayu atau non-kayu, ukuran, tarif cat, packing."],
  ["/master", "Harga reseller", "Harga jual ke reseller, bukan harga grosir."],
  ["/pencairan/erp", "Pasangan toko ERP", "Enam toko Shopee yang masuk laporan."],
  ["/laporan/tutup-buku", "Tutup buku", "Akhir bulan."],
  ["/akun", "Profil", "Akun dan staf."],
];

export default function PengaturanPage() {
  return (
    <>
      <PageHeader judul="Pengaturan" sub="Katalog, harga reseller, saluran, dan tutup buku." />
      {tautan.map(([ke, judul, sub]) => (
        <Card key={judul} judul={judul} aksi={<Link to={ke}>Buka</Link>}>{sub}</Card>
      ))}
    </>
  );
}
