import { Navigate, Outlet } from "react-router-dom";
import { isPemilik, useAuth } from "../../../auth/AuthContext";
import { Loading } from "./UI";

export function Protected() {
  const { user, memuat } = useAuth();
  if (memuat) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/masuk" replace />;
}
export function PasswordRequired() {
  const { user } = useAuth();
  return user?.must_change_password ? <Navigate to="/akun" replace /> : <Outlet />;
}
export function FinanceOnly() {
  const { user } = useAuth();
  return isPemilik(user?.role) ? <Outlet /> : <Navigate to="/kas-kecil" replace />;
}
