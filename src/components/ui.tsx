import {
  Alert,
  App,
  Button as AButton,
  Card as ACard,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input as AInput,
  Modal,
  Progress as AProgress,
  Select as ASelect,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs as ATabs,
  Tag,
  Typography,
  theme,
} from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import {
  Children,
  Fragment,
  isValidElement,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/** Komponen dasar aplikasi: pembungkus tipis di atas Ant Design (tampilan default antd). */

export function PageHeader({ judul, sub, aksi }: { judul: string; sub?: ReactNode; aksi?: ReactNode }) {
  return (
    <Flex justify="space-between" align="flex-start" wrap gap="small">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {judul}
        </Typography.Title>
        {sub && <Typography.Text type="secondary">{sub}</Typography.Text>}
      </div>
      {aksi && <Space wrap>{aksi}</Space>}
    </Flex>
  );
}

export function Card({ judul, aksi, children }: { judul?: string; aksi?: ReactNode; children: ReactNode }) {
  return (
    <ACard title={judul} extra={aksi}>
      {children}
    </ACard>
  );
}

export function Stat({ label, nilai, sub, warna }: { label: string; nilai: string; sub?: string; warna?: "hijau" | "merah" | "oranye" }) {
  const { token } = theme.useToken();
  const w = warna === "merah" ? token.colorError : warna === "oranye" ? token.colorWarning : warna === "hijau" ? token.colorSuccess : undefined;
  return (
    <ACard style={{ height: "100%" }}>
      <Statistic title={label} value={nilai} styles={{ content: { color: w } }} />
      {sub && <Typography.Text type="secondary">{sub}</Typography.Text>}
    </ACard>
  );
}

export function Button({
  variant = "utama",
  kecil,
  penuh,
  type,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "utama" | "pinggir" | "bahaya"; kecil?: boolean; penuh?: boolean }) {
  return (
    <AButton
      htmlType={type ?? "button"}
      type={variant === "pinggir" ? "default" : "primary"}
      danger={variant === "bahaya"}
      size={kecil ? "small" : "middle"}
      onClick={p.onClick as never}
      disabled={p.disabled}
      block={penuh}
    >
      {children}
    </AButton>
  );
}

/** Label di atas isian. Tanda wajib (*) muncul bila isian bertanda `required`. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const wajib = isValidElement(children) && Boolean((children.props as { required?: boolean }).required);
  return (
    <Form.Item label={label} extra={hint} required={wajib} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
      {children}
    </Form.Item>
  );
}

/** Formulir antd (label di atas). `onKirim` dipanggil saat tombol submit ditekan dan isian wajib terisi. */
export function Formulir({ onKirim, children, disabled }: { onKirim: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <Form layout="vertical" disabled={disabled} onFinish={() => onKirim()}>
      {children}
    </Form>
  );
}

/** Baris tombol simpan (dan pesan galat) di dasar formulir. */
export function AksiForm({ error, children }: { error?: unknown; children: ReactNode }) {
  return (
    <Form.Item>
      <Flex vertical gap="small">
        <ErrorBox error={error} />
        {children}
      </Flex>
    </Form.Item>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) =>
  p.type === "password" ? <AInput.Password {...(p as object)} onChange={p.onChange as never} /> : <AInput {...(p as object)} onChange={p.onChange as never} />;

export const Teks = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <AInput.TextArea {...(p as object)} autoSize={{ minRows: 3 }} onChange={p.onChange as never} />
);

/** Tanggal (atau bulan) dengan DatePicker. Nilai berupa teks "YYYY-MM-DD" ("YYYY-MM" untuk bulan). */
export function InputTanggal({
  value,
  onChange,
  bulan,
  disabled,
  kosongBoleh,
}: {
  value: string;
  onChange: (v: string) => void;
  bulan?: boolean;
  disabled?: boolean;
  kosongBoleh?: boolean;
}) {
  const fmt = bulan ? "YYYY-MM" : "YYYY-MM-DD";
  return (
    <DatePicker
      style={{ width: "100%" }}
      picker={bulan ? "month" : "date"}
      format={bulan ? "MMMM YYYY" : "DD/MM/YYYY"}
      value={value ? dayjs(value) : null}
      allowClear={Boolean(kosongBoleh)}
      disabled={disabled}
      onChange={(d) => onChange(d ? d.format(fmt) : "")}
    />
  );
}

interface OpsiSelect {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
/** Ubah anak `<option>` (gaya HTML) menjadi opsi antd, termasuk yang dibungkus fragment/array. */
function ambilOpsi(anak: ReactNode, hasil: OpsiSelect[] = []): OpsiSelect[] {
  Children.forEach(anak, (c) => {
    if (!isValidElement(c)) return;
    const el = c as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
    if (el.type === "option") {
      const teks = el.props.children;
      hasil.push({ value: String(el.props.value ?? (typeof teks === "string" ? teks : "")), label: teks, disabled: el.props.disabled });
    } else if (el.type === Fragment || el.props.children) {
      ambilOpsi(el.props.children, hasil);
    }
  });
  return hasil;
}

export const Select = ({ children, value, onChange, disabled }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <ASelect
    style={{ width: "100%" }}
    value={value === undefined || value === null ? undefined : String(value)}
    options={ambilOpsi(children)}
    disabled={disabled}
    showSearch={{ optionFilterProp: "label" }}
    onChange={(v) => onChange?.({ target: { value: v }, currentTarget: { value: v } } as unknown as ChangeEvent<HTMLSelectElement>)}
  />
);

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const teks = error instanceof Error ? error.message : String(error);
  return <Alert type="error" showIcon title={teks} role="alert" />;
}

export function Memuat({ teks = "Memuat…" }: { teks?: string }) {
  return (
    <Flex vertical align="center" gap="small" style={{ padding: 48 }}>
      <Spin />
      <Typography.Text type="secondary">{teks}</Typography.Text>
    </Flex>
  );
}

/** Angka rata digit dan tidak terpotong baris. */
export function Angka({ children, tebal }: { children: ReactNode; tebal?: boolean }) {
  return <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: tebal ? 600 : undefined }}>{children}</span>;
}

export function Baris({ kiri, kanan, tebal }: { kiri: ReactNode; kanan: ReactNode; tebal?: boolean }) {
  return (
    <Flex justify="space-between" align="baseline" gap="small" style={{ padding: "6px 0" }}>
      <Typography.Text strong={tebal}>{kiri}</Typography.Text>
      <Typography.Text strong={tebal}>
        <Angka>{kanan}</Angka>
      </Typography.Text>
    </Flex>
  );
}

export function Progress({ nilai, maks }: { nilai: number; maks: number }) {
  const persen = maks > 0 ? Math.max(0, Math.min(100, (nilai / maks) * 100)) : 0;
  return <AProgress percent={Math.round(persen)} showInfo={false} />;
}

export const Kosong = ({ teks }: { teks: string }) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={teks} />;

/** Jendela formulir (antd Modal). Esc menutup. */
export function Dialog({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  return (
    <Modal open title={judul} onCancel={onTutup} footer={null} destroyOnHidden centered width={560}>
      {children}
    </Modal>
  );
}

export function Tabs<T extends string>({ daftar, aktif, onPilih }: { daftar: { id: T; label: string }[]; aktif: T; onPilih: (id: T) => void }) {
  return <ATabs activeKey={aktif} onChange={(k) => onPilih(k as T)} items={daftar.map((t) => ({ key: t.id, label: t.label }))} />;
}

const WARNA_TAG = { hijau: "success", oranye: "warning", merah: "error", abu: "default" } as const;
export function Lencana({ children, warna = "abu" }: { children: ReactNode; warna?: "hijau" | "oranye" | "merah" | "abu" }) {
  return <Tag color={WARNA_TAG[warna]}>{children}</Tag>;
}

/** Tombol aksi kecil bergaya tautan di dalam sel tabel. */
export function TombolLink({ bahaya, disabled, onClick, children }: { bahaya?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <AButton type="link" size="small" danger={bahaya} disabled={disabled} onClick={onClick}>
      {children}
    </AButton>
  );
}

/**
 * Tabel sungguhan (antd Table) di semua ukuran layar: di layar sempit digulir ke samping, bukan diubah jadi kartu.
 * Kolom pertama bisa dikunci (`fixed: "left"`) agar tetap terlihat saat digulir.
 */
export function DataTabel<T extends object>({
  kolom,
  data,
  rowKey,
  minLebar = 640,
  ringkasan,
  kosong = "Belum ada data",
}: {
  kolom: TableColumnsType<T>;
  data: readonly T[];
  rowKey: (keyof T & string) | ((r: T) => string);
  minLebar?: number;
  ringkasan?: () => ReactNode;
  kosong?: string;
}) {
  return (
    <Table<T>
      columns={kolom}
      dataSource={data as T[]}
      rowKey={rowKey as never}
      pagination={false}
      tableLayout="auto"
      scroll={{ x: minLebar }}
      locale={{ emptyText: <Kosong teks={kosong} /> }}
      summary={ringkasan ? () => <Table.Summary>{ringkasan()}</Table.Summary> : undefined}
    />
  );
}

/** Baris total di dasar DataTabel. `span` menggabungkan kolom; `kanan` meratakan ke kanan. */
export function BarisTotal({ sel }: { sel: { isi: ReactNode; kanan?: boolean; span?: number }[] }) {
  let idx = 0;
  return (
    <Table.Summary.Row>
      {sel.map((c, i) => {
        const index = idx;
        idx += c.span ?? 1;
        return (
          <Table.Summary.Cell key={i} index={index} colSpan={c.span ?? 1} align={c.kanan ? "right" : "left"}>
            <Typography.Text strong>{c.kanan ? <Angka>{c.isi}</Angka> : c.isi}</Typography.Text>
          </Table.Summary.Cell>
        );
      })}
    </Table.Summary.Row>
  );
}

/** Dialog konfirmasi dan isian (Modal antd) sebagai pengganti window.confirm / prompt / alert. */
export function useDialog() {
  const { modal, message } = App.useApp();

  const konfirmasi = (judul: string, opsi?: { teks?: ReactNode; ok?: string; bahaya?: boolean }) =>
    new Promise<boolean>((resolve) => {
      modal.confirm({
        title: judul,
        content: opsi?.teks,
        okText: opsi?.ok ?? "Ya",
        cancelText: "Batal",
        okButtonProps: { danger: opsi?.bahaya },
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  /** Minta isian teks. Hasil null bila dibatalkan. `min`: panjang minimal; `sandi`: sembunyikan huruf; `panjang`: kolom beberapa baris. */
  const tanya = (judul: string, opsi: { label?: ReactNode; awal?: string; min?: number; sandi?: boolean; panjang?: boolean; ok?: string }) =>
    new Promise<string | null>((resolve) => {
      let nilai = opsi.awal ?? "";
      const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        nilai = e.target.value;
      };
      modal.confirm({
        title: judul,
        icon: null,
        centered: true,
        content: (
          <Flex vertical gap="small">
            {opsi.label && <Typography.Text type="secondary">{opsi.label}</Typography.Text>}
            {opsi.sandi ? (
              <AInput.Password autoFocus onChange={onChange} />
            ) : opsi.panjang ? (
              <AInput.TextArea autoFocus rows={3} defaultValue={opsi.awal} onChange={onChange} />
            ) : (
              <AInput autoFocus defaultValue={opsi.awal} onChange={onChange} />
            )}
          </Flex>
        ),
        okText: opsi.ok ?? "Simpan",
        cancelText: "Batal",
        onOk: () => {
          if (nilai.trim().length < (opsi.min ?? 0)) {
            message.warning(`Isi minimal ${opsi.min} karakter.`);
            return Promise.reject(new Error("terlalu pendek"));
          }
          resolve(nilai.trim());
        },
        onCancel: () => resolve(null),
      });
    });

  return { konfirmasi, tanya, message };
}
