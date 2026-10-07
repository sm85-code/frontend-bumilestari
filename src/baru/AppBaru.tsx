import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Masuk from "../pages/Masuk";
import Layout from "./keu/components/Layout";
import { FinanceOnly, PasswordRequired, Protected } from "./keu/components/Guard";
import { Loading } from "./keu/components/UI";
const Dashboard = lazy(() => import("./keu/pages/Dashboard"));
const Orders = lazy(() => import("./keu/pages/Orders"));
const Production = lazy(() => import("./keu/pages/Production"));
const Reports = lazy(() => import("./keu/pages/Reports"));
const Inventory = lazy(() => import("./keu/pages/Inventory"));
const Receivables = lazy(() => import("./keu/pages/Receivables"));
const Finance = lazy(() => import("./keu/pages/Finance"));
const Settings = lazy(() => import("./keu/pages/Settings"));
const Imports = lazy(() => import("./keu/pages/Imports"));
const Sync = lazy(() => import("./keu/pages/Sync"));
const Account = lazy(() => import("../pages/Akun"));
const PettyCash = lazy(() => import("../pages/KasKecil"));

export default function AppBaru() {
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/masuk" element={<Masuk />} />
    <Route element={<Protected />}><Route element={<Layout />}>
      <Route path="/akun" element={<Account />} />
      <Route element={<PasswordRequired />}>
        <Route path="/kas-kecil" element={<PettyCash />} />
        <Route element={<FinanceOnly />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order" element={<Orders />} />
          <Route path="/order/peta" element={<Orders />} />
          <Route path="/produksi" element={<Production />} />
          <Route path="/keuangan" element={<Finance />} />
          <Route path="/laporan-keuangan" element={<Reports />} />
          <Route path="/persediaan" element={<Inventory />} />
          <Route path="/piutang" element={<Receivables />} />
          <Route path="/pengaturan" element={<Settings />} />
          <Route path="/impor" element={<Imports />} />
          <Route path="/sinkronisasi" element={<Sync />} />
        </Route>
      </Route>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
