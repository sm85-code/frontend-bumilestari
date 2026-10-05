import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isPemilik, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { Memuat } from "./components/ui";
const Akun = lazy(() => import("./pages/Akun"));
const Beranda = lazy(() => import("./pages/DashboardBaru"));
const KasKecil = lazy(() => import("./pages/KasKecil"));
const Keuangan = lazy(() => import("./pages/Keuangan"));
const LaporanKasKecilPage = lazy(() => import("./pages/LaporanKasKecil"));
const LaporanKeuanganPage = lazy(() => import("./pages/LaporanKeuangan"));
const RingkasanOwnerPage = lazy(() => import("./pages/RingkasanOwner"));
const KolomTambahanPage = lazy(() => import("./pages/KolomTambahan"));
import Masuk from "./pages/Masuk";
const BagiHasilPage = lazy(() => import("./pages/BagiHasil"));
const GajiPage = lazy(() => import("./pages/Gaji"));
const Lainnya = lazy(() => import("./pages/Lainnya"));
const KirimanPage = lazy(() => import("./pages/Kiriman"));
const TutupBukuPage = lazy(() => import("./pages/TutupBuku"));
const BelumCairPage = lazy(() => import("./pages/BelumCair"));
const PencairanPage = lazy(() => import("./pages/Pencairan"));
const PencairanErpPage = lazy(() => import("./pages/PencairanErp"));
const KasIklanPage = lazy(() => import("./pages/KasIklan"));
const Master = lazy(() => import("./pages/Master"));
const OrderPage = lazy(() => import("./pages/Order"));
const ProduksiPage = lazy(() => import("./pages/Produksi"));
const PetaNamaPage = lazy(() => import("./pages/PetaNama"));
const PengaturanPage = lazy(() => import("./pages/Pengaturan"));
const PenjualLain = lazy(() => import("./pages/PenjualLain"));
const PesananTukang = lazy(() => import("./pages/PesananTukang"));
const Selasa = lazy(() => import("./pages/Selasa"));


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

function HanyaAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === "admin" ? <>{children}</> : <Navigate to="/" replace />;
}

function WajibGantiPassword({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.must_change_password ? <Navigate to="/akun" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<Memuat />}>
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
          path="/kas-iklan"
          element={
            <WajibGantiPassword>
              <HanyaAdmin>
                <KasIklanPage />
              </HanyaAdmin>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/master/kolom"
          element={
            <WajibGantiPassword>
              <HanyaAdmin>
                <KolomTambahanPage />
              </HanyaAdmin>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/pencairan/erp"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <PencairanErpPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route path="/order/peta" element={<WajibGantiPassword><HanyaPemilik><PetaNamaPage /></HanyaPemilik></WajibGantiPassword>} />
        <Route path="/produksi" element={<WajibGantiPassword><HanyaPemilik><ProduksiPage /></HanyaPemilik></WajibGantiPassword>} />
        <Route path="/pengaturan" element={<WajibGantiPassword><HanyaPemilik><PengaturanPage /></HanyaPemilik></WajibGantiPassword>} />
        <Route
          path="/pencairan"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <PencairanPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/laporan/belum-cair"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <BelumCairPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/laporan/tutup-buku"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <TutupBukuPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/kiriman"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <KirimanPage />
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
                <LaporanKeuanganPage />
              </HanyaPemilik>
            </WajibGantiPassword>
          }
        />
        <Route
          path="/ringkasan"
          element={
            <WajibGantiPassword>
              <HanyaPemilik>
                <RingkasanOwnerPage />
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
    </Suspense>
  );
}
