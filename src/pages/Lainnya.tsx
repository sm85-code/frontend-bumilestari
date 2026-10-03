import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card, PageHeader } from "../components/ui";
import { MENU_LAINNYA } from "../components/Layout";

/** Daftar menu lengkap untuk HP (navigasi bawah hanya memuat menu utama). */
export default function Lainnya() {
  const { user, keluar } = useAuth();
  return (
    <>
      <PageHeader judul="Menu lainnya" />
      <Card>
        <ul className="divide-y divide-garis">
          {MENU_LAINNYA.filter((m) => !m.admin || user?.role === "admin").map((m) => (
            <li key={m.ke}>
              <Link to={m.ke} className="flex min-h-12 items-center gap-3 text-sm font-medium text-tinta">
                <span aria-hidden className="text-lg text-hijau">{m.ikon}</span>
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Button block size="large" icon={<LogoutOutlined />} onClick={() => void keluar()}>
        Keluar
      </Button>
    </>
  );
}
