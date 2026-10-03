import { Alert, Button as AButton, Card as ACard, Empty, Input as AInput, Modal, Progress as AProgress, Select as ASelect, Spin, Statistic, Tabs as ATabs, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Table } from "antd";
import {
  Children,
  Fragment,
  isValidElement,
  type ChangeEvent,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { WARNA } from "../theme";

/** Komponen dasar aplikasi, dibangun di atas Ant Design. Nama dan prop dipertahankan agar halaman tidak perlu diubah. */

export function PageHeader({ judul, sub, aksi }: { judul: string; sub?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Typography.Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: "-0.01em" }}>
          {judul}
        </Typography.Title>
        {sub && <Typography.Text type="secondary">{sub}</Typography.Text>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}

export function Card({ judul, aksi, children, className = "" }: { judul?: string; aksi?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <ACard className={className} variant="borderless" style={{ boxShadow: "var(--ant-box-shadow-tertiary)" }} styles={{ body: { padding: 0 } }}>
      {(judul || aksi) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-garis px-4 py-3">
          {judul && <h2 className="min-w-0 text-sm font-extrabold">{judul}</h2>}
          {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </ACard>
  );
}

export function Stat({ label, nilai, sub, warna }: { label: string; nilai: string; sub?: string; warna?: "hijau" | "merah" | "oranye" }) {
  const w = warna === "merah" ? "#d03a3a" : warna === "oranye" ? WARNA.oranye : warna === "hijau" ? WARNA.hijau : WARNA.tinta;
  return (
    <ACard variant="borderless" style={{ boxShadow: "var(--ant-box-shadow-tertiary)", height: "100%" }} styles={{ body: { padding: 16 } }}>
      <Statistic title={label} value={nilai} styles={{ content: { color: w, fontWeight: 800, fontSize: 22 } }} />
      {sub && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{sub}</Typography.Text>}
    </ACard>
  );
}

export function Button({ variant = "utama", kecil, className = "", type, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "utama" | "pinggir" | "bahaya"; kecil?: boolean }) {
  const { onClick, disabled, style, title, form } = p;
  return (
    <AButton
      htmlType={type ?? "button"}
      type={variant === "pinggir" ? "default" : "primary"}
      danger={variant === "bahaya"}
      size={kecil ? "small" : "middle"}
      onClick={onClick as never}
      disabled={disabled}
      style={style}
      title={title}
      form={form}
      className={className}
    >
      {children}
    </AButton>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold" style={{ color: WARNA.redup }}>
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs" style={{ color: WARNA.redup }}>{hint}</span>}
    </label>
  );
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) =>
  p.type === "password" ? (
    <AInput.Password {...(p as object)} size="large" className={className} onChange={p.onChange as never} />
  ) : (
    <AInput {...(p as object)} size="large" className={className} onChange={p.onChange as never} />
  );

export const Teks = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <AInput.TextArea {...(p as object)} autoSize={{ minRows: 3 }} className={className} onChange={p.onChange as never} />
);

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

export const Select = ({ className, children, value, onChange, disabled }: SelectHTMLAttributes<HTMLSelectElement>) => {
  const opsi = ambilOpsi(children);
  return (
    <ASelect
      size="large"
      className={`w-full ${className ?? ""}`}
      value={value === undefined || value === null ? undefined : String(value)}
      options={opsi}
      disabled={disabled}
      showSearch={{ optionFilterProp: "label" }}
      onChange={(v) => onChange?.({ target: { value: v }, currentTarget: { value: v } } as unknown as ChangeEvent<HTMLSelectElement>)}
      popupMatchSelectWidth={false}
      getPopupContainer={(el) => el.parentElement ?? document.body}
    />
  );
};

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const teks = error instanceof Error ? error.message : String(error);
  return <Alert type="error" showIcon title={teks} role="alert" />;
}

export function Memuat({ teks = "Memuat…" }: { teks?: string }) {
  return (
    <div className="py-10 text-center">
      <Spin />
      <p className="mt-2 text-sm" style={{ color: WARNA.redup }}>{teks}</p>
    </div>
  );
}

export function Baris({ kiri, kanan, tebal }: { kiri: ReactNode; kanan: ReactNode; tebal?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${tebal ? "font-bold" : ""}`}>
      <span>{kiri}</span>
      <span className="shrink-0 tabular-nums">{kanan}</span>
    </div>
  );
}

export function Progress({ nilai, maks }: { nilai: number; maks: number }) {
  const persen = maks > 0 ? Math.max(0, Math.min(100, (nilai / maks) * 100)) : 0;
  return <AProgress percent={Math.round(persen)} showInfo={false} strokeColor={WARNA.hijau} size="small" />;
}

export const Kosong = ({ teks }: { teks: string }) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={teks} className="!my-4" />;

/** Jendela formulir (antd Modal). Esc menutup. */
export function Dialog({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  return (
    <Modal open title={<span style={{ fontWeight: 800 }}>{judul}</span>} onCancel={onTutup} footer={null} destroyOnHidden centered width={560} maskClosable={false}>
      {children}
    </Modal>
  );
}

export function Tabs<T extends string>({ daftar, aktif, onPilih }: { daftar: { id: T; label: string }[]; aktif: T; onPilih: (id: T) => void }) {
  return <ATabs activeKey={aktif} onChange={(k) => onPilih(k as T)} items={daftar.map((t) => ({ key: t.id, label: t.label }))} />;
}

const WARNA_TAG = { hijau: "success", oranye: "warning", merah: "error", abu: "default" } as const;
export function Lencana({ children, warna = "abu" }: { children: ReactNode; warna?: "hijau" | "oranye" | "merah" | "abu" }) {
  return (
    <Tag color={WARNA_TAG[warna]} variant="filled" style={{ marginInlineEnd: 0, fontWeight: 600 }}>
      {children}
    </Tag>
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
  onKlikBaris,
}: {
  kolom: TableColumnsType<T>;
  data: readonly T[];
  rowKey: keyof T & string | ((r: T) => string);
  minLebar?: number;
  ringkasan?: () => ReactNode;
  kosong?: string;
  onKlikBaris?: (r: T) => void;
}) {
  return (
    <Table<T>
      size="middle"
      columns={kolom}
      dataSource={data as T[]}
      rowKey={rowKey as never}
      pagination={false}
      tableLayout="auto"
      scroll={{ x: minLebar }}
      locale={{ emptyText: <Kosong teks={kosong} /> }}
      summary={ringkasan ? () => <Table.Summary>{ringkasan()}</Table.Summary> : undefined}
      onRow={onKlikBaris ? (r) => ({ onClick: () => onKlikBaris(r), style: { cursor: "pointer" } }) : undefined}
    />
  );
}


/** Tombol aksi kecil bergaya tautan di dalam sel tabel. */
export function TombolLink({ bahaya, disabled, onClick, children }: { bahaya?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <AButton type="link" size="small" danger={bahaya} disabled={disabled} onClick={onClick} style={{ paddingInline: 6, fontWeight: 600 }}>
      {children}
    </AButton>
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
            <b className={c.kanan ? "tabular-nums" : ""}>{c.isi}</b>
          </Table.Summary.Cell>
        );
      })}
    </Table.Summary.Row>
  );
}
