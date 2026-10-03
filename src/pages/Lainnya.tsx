import { LogoutOutlined } from "@ant-design/icons";
import { Button, List, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Card, PageHeader } from "../components/ui";
import { MENU_LAINNYA } from "../components/menu";

/** Daftar menu lengkap untuk HP (navigasi bawah hanya memuat menu utama), dikelompokkan seperti menu samping. */
export default function Lainnya() {
  const { keluar } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader judul="Menu lainnya" />
      {MENU_LAINNYA.map((g) => (
        <Card key={g.grup}>
          <Typography.Text type="secondary" strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {g.grup}
          </Typography.Text>
          <List
            dataSource={g.item}
            renderItem={(m) => (
              <List.Item onClick={() => navigate(m.ke)} style={{ cursor: "pointer" }} extra={<span>›</span>}>
                <List.Item.Meta avatar={m.ikon} title={m.label} />
              </List.Item>
            )}
          />
        </Card>
      ))}
      <Button block icon={<LogoutOutlined />} onClick={() => void keluar()}>
        Keluar
      </Button>
    </>
  );
}
