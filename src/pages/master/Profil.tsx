import { Alert, Col, Row, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { AksiForm, Button, Card, ErrorBox, Field, Formulir, Input, InputTanggal, Memuat, Teks } from "../../components/ui";
import { api } from "../../lib/api";
import { useAksi } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num } from "../../lib/format";
import type { Profil } from "../../lib/types";

function FormProfil({ p, bolehUbah }: { p: Profil; bolehUbah: boolean }) {
  const aksi = useAksi();
  const { f, bind, bindNilai } = useFields({
    nama_usaha: p.nama_usaha, alamat: p.alamat, telepon: p.telepon, email: p.email, catatan: p.catatan,
    biaya_proses_order: String(Math.round(num(p.biaya_proses_order))), info_pembayaran: p.info_pembayaran,
    nama_usaha_lama: p.nama_usaha_lama, nama_usaha_berlaku_mulai: p.nama_usaha_berlaku_mulai ?? "",
  });
  const [ok, setOk] = useState(false);
  return (
    <Formulir
      disabled={!bolehUbah}
      onKirim={() => {
        setOk(false);
        aksi.mutate(
          { path: "/profil", method: "PUT", body: { ...f, nama_usaha: f.nama_usaha.trim(), biaya_proses_order: bersihkanAngka(f.biaya_proses_order) || "0", nama_usaha_berlaku_mulai: f.nama_usaha_berlaku_mulai || null } },
          { onSuccess: () => setOk(true) },
        );
      }}
    >
        <Row gutter={16}>
<Col xs={24} md={12}>
          <Field label="Nama usaha (tercetak di PO dan invoice)">
            <Input required {...bind("nama_usaha")} />
          </Field>
</Col>
<Col xs={24} md={12}>
          <Field label="Telepon">
            <Input {...bind("telepon")} />
          </Field>
</Col>
<Col xs={24} md={12}>
          <Field label="Nama usaha sebelumnya" hint="Dokumen bertanggal sebelum tanggal peralihan memakai nama ini">
            <Input {...bind("nama_usaha_lama")} />
          </Field>
</Col>
<Col xs={24} md={12}>
          <Field label="Nama baru berlaku mulai">
            <InputTanggal kosongBoleh {...bindNilai("nama_usaha_berlaku_mulai")} />
          </Field>
</Col>
<Col xs={24} md={12}>
          <Field label="Email">
            <Input type="email" {...bind("email")} />
          </Field>
</Col>
<Col xs={24} md={12}>
          <Field label="Biaya proses pesanan (Rp per order)" hint="Flat untuk order penjual lain; disalin ke order saat dibuat">
            <Input inputMode="numeric" {...bind("biaya_proses_order")} />
          </Field>
</Col>
        </Row>
        <Field label="Alamat usaha">
          <Teks {...bind("alamat")} />
        </Field>
        <Field label="Tujuan pembayaran (tercetak di invoice)" hint="mis. QRIS Pangeran Homeware atau nomor rekening">
          <Input {...bind("info_pembayaran")} />
        </Field>
        <Field label="Catatan">
          <Input {...bind("catatan")} />
        </Field>
      <AksiForm error={aksi.error}>
        {ok && <Alert type="success" showIcon title="Profil disimpan." />}
        {bolehUbah ? (
          <Button type="submit" disabled={aksi.isPending}>Simpan profil</Button>
        ) : (
          <Typography.Text type="secondary">Hanya admin yang boleh mengubah profil.</Typography.Text>
        )}
      </AksiForm>
    </Formulir>
  );
}

function FormProporsi({ p, bolehUbah }: { p: Profil; bolehUbah: boolean }) {
  const aksi = useAksi();
  const awal = (k: "admin" | "owner") => String(num(p.proporsi_bagi_hasil.find((x) => x.penerima === k)?.persen));
  const { f, bind } = useFields({ admin: awal("admin"), owner: awal("owner") });
  const total = num(f.admin) + num(f.owner);
  return (
    <Formulir
      disabled={!bolehUbah}
      onKirim={() => {
        aksi.mutate({ path: "/profil/proporsi-bagi-hasil", method: "PUT", body: { persen_admin: f.admin, persen_owner: f.owner } });
      }}
    >
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Field label="Admin (%)">
            <Input inputMode="decimal" {...bind("admin")} />
          </Field>
        </Col>
        <Col xs={12} md={6}>
          <Field label="Owner (%)">
            <Input inputMode="decimal" {...bind("owner")} />
          </Field>
        </Col>
      </Row>
      <Typography.Paragraph type={total === 100 ? "success" : "danger"}>
        Total {total}% {total === 100 ? "" : "(harus 100%)"}
      </Typography.Paragraph>
      <AksiForm error={aksi.error}>
        {bolehUbah && (
          <Button type="submit" disabled={aksi.isPending || total !== 100}>
            Simpan proporsi
          </Button>
        )}
      </AksiForm>
    </Formulir>
  );
}

export default function MasterProfil() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["profil"], queryFn: () => api<Profil>("/profil") });
  const bolehUbah = user?.role === "admin";
  if (q.isLoading) return <Memuat />;
  if (!q.data) return <ErrorBox error={q.error} />;
  return (
    <>
      <Card judul="Profil UMKM">
        <FormProfil key={JSON.stringify(q.data)} p={q.data} bolehUbah={bolehUbah} />
      </Card>
      <Card judul="Proporsi bagi hasil dari laba bersih">
        <FormProporsi key={JSON.stringify(q.data.proporsi_bagi_hasil)} p={q.data} bolehUbah={bolehUbah} />
      </Card>
    </>
  );
}
