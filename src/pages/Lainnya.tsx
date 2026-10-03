import { LogoutOutlined } from "@ant-design/icons";
import { Button, List } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card, PageHeader } from "../components/ui";
import { MENU_LAINNYA } from "../components/Layout";

/** Daftar menu lengkap untuk HP (navigasi bawah hanya memuat menu utama). */
export default function Lainnya() {
  const { user, keluar } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader judul="Menu lainnya" />
      <Card>
        <List
          dataSource={MENU_LAINNYA.filter((m) => !m.admin || user?.role === "admin")}
          renderItem={(m) => (
            <List.Item onClick={() => navigate(m.ke)} style={{ cursor: "pointer" }} extra={<span>›</span>}>
              <List.Item.Meta avatar={m.ikon} title={m.label} />
            </List.Item>
          )}
        />
      </Card>
      <Button block icon={<LogoutOutlined />} onClick={() => void keluar()}>
        Keluar
      </Button>
    </>
  );
}
