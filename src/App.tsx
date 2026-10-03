import { Navigate, Route, Routes } from "react-router-dom";
import { isPemilik, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { Memuat } from "./components/ui";
import Akun from "./pages/Akun";
import Beranda from "./pages/Beranda";
import KasKecil from "./pages/KasKecil";
import Keuangan from "./pages/Keuangan";
import LaporanKasKecilPage from "./pages/LaporanKasKecil";
import LaporanUmumPage from "./pages/LaporanUmum";
import Masuk from "./pages/Masuk";
import BagiHasilPage from "./pages/BagiHasil";
import GajiPage from "./pages/Gaji";
import Lainnya from "./pages/Lainnya";
import Master from "./pages/Master";
import OrderPage from "./pages/Order";
import PenjualLain from "./pages/PenjualLain";
import PesananTukang from "./pages/PesananTukang";
import Selasa from "./pages/Selasa";


/** Harus login; kalau password masih bawaan, paksa ke halaman Akun. */
function Terproteksi() {
  const { user, memuat } = useAuth();
  if (memuat) return <Memuat />;
  if (!user) return <Navigate to="/masuk" replace />;
  return <Layout />;
}

function HanyaPemilik({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return isPemilik(user?.role) ? <>{children}</> : <Navigate to="/kas-kecil" replace />;
}

function WajibGantiPassword({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.must_change_password ? <Navigate to="/akun" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/masuk" element={<Masuk />} />
      <Route element={<Terproteksi />}>
        <Route path="/akun" element={<Akun />} />
        <Route
          path="/"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <Beranda />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/keuangan"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <Keuangan />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/order"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <OrderPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/pesanan-tukang"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <PesananTukang />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/penjual-lain"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <PenjualLain />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/selasa"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <Selasa />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/gaji"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <GajiPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/bagi-hasil"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <BagiHasilPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/master"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <Master />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/lainnya"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <Lainnya />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/kas-kecil"
          element={
            <WajibGantiPassword>
              <KasKecil />
            </WajibGantiPassword>
          }
        />
        <Route
          path="/laporan"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <LaporanUmumPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/laporan/kas-kecil"
          element={
            <WajibGantiPassword>
              <LaporanKasKecilPage />
            </WajibGantiPassword>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
