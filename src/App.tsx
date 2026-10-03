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
