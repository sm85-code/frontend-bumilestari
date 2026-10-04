import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PageHeader, Tabs } from "../components/ui";
import MasterAkunKategori from "./master/AkunKategori";
import MasterFormatPenghasilan from "./master/FormatPenghasilan";
import MasterHargaGrosir from "./master/HargaGrosir";
import MasterPelanggan from "./master/Pelanggan";
import MasterPemasok from "./master/Pemasok";
import MasterPengguna from "./master/Pengguna";
import MasterProduk from "./master/Produk";
import MasterProfil from "./master/Profil";
import MasterSaluran from "./master/Saluran";

type Tab = "produk" | "tukang" | "supplier" | "pelanggan" | "harga" | "saluran" | "akun" | "pengguna" | "profil";

export default function Master() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("produk");
  const admin = user?.role === "admin";
  const daftar: { id: Tab; label: string }[] = [
    { id: "produk", label: "Produk" },
    { id: "tukang", label: "Tukang" },
    { id: "supplier", label: "Supplier" },
    { id: "pelanggan", label: "Penjual lain" },
    { id: "harga", label: "Harga grosir" },
    { id: "saluran", label: "Saluran" },
    { id: "akun", label: "Akun kas & kategori" },
    ...(admin ? [{ id: "pengguna" as const, label: "Pengguna" }] : []),
    { id: "profil", label: "Profil UMKM" },
  ];
  return (
    <>
      <PageHeader
        judul="Data master"
        sub="Produk, tukang, supplier, penjual lain, harga grosir, saluran, akun kas & kategori, pengguna, dan profil usaha"
        aksi={admin ? <Link to="/master/kolom">Kolom & label →</Link> : undefined}
      />
      <Tabs daftar={daftar} aktif={tab} onPilih={setTab} />
      {tab === "produk" && <MasterProduk />}
      {tab === "tukang" && <MasterPemasok key="tukang" jenis="tukang_kayu" />}
      {tab === "supplier" && <MasterPemasok key="supplier" jenis="supplier" />}
      {tab === "pelanggan" && <MasterPelanggan />}
      {tab === "harga" && <MasterHargaGrosir />}
      {tab === "saluran" && <MasterSaluran />}
      {tab === "saluran" && admin && <MasterFormatPenghasilan />}
      {tab === "akun" && <MasterAkunKategori />}
      {tab === "pengguna" && admin && <MasterPengguna />}
      {tab === "profil" && <MasterProfil />}
    </>
  );
}
