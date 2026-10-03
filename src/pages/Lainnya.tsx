import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../components/ui";
import { MENU_LAINNYA } from "../components/Layout";

/** Daftar menu lengkap untuk HP (navigasi bawah hanya memuat menu utama). */
export default function Lainnya() {
  const { user, keluar } = useAuth();
  return (
    <>
      <h1 className="text-lg font-bold">Menu lainnya</h1>
      <Card>
        <ul className="divide-y divide-garis">
          {MENU_LAINNYA.filter((m) => !m.admin || user?.role === "admin").map((m) => (
            <li key={m.ke}>
              <Link to={m.ke} className="flex min-h-12 items-center gap-3 text-sm">
                <span aria-hidden>{m.ikon}</span>
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <button onClick={() => void keluar()} className="min-h-11 w-full rounded-xl border border-garis bg-white text-sm font-semibold">
        Keluar
      </button>
    </>
  );
}
