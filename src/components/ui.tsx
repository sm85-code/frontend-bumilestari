import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Card({ judul, aksi, children, className = "" }: { judul?: string; aksi?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-garis bg-white p-4 shadow-sm ${className}`}>
      {(judul || aksi) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {judul && <h2 className="text-sm font-semibold text-coklat">{judul}</h2>}
          {aksi}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, nilai, sub, warna }: { label: string; nilai: string; sub?: string; warna?: "hijau" | "merah" | "oranye" }) {
  const w = warna === "merah" ? "text-red-600" : warna === "oranye" ? "text-oranye" : warna === "hijau" ? "text-hijau" : "text-stone-900";
  return (
    <div className="rounded-2xl border border-garis bg-white p-3 shadow-sm">
      <p className="text-xs text-coklat">{label}</p>
      <p className={`mt-1 text-lg font-bold leading-tight ${w}`}>{nilai}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function Button({ variant = "utama", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "utama" | "pinggir" | "bahaya" }) {
  const v =
    variant === "utama"
      ? "bg-hijau text-white active:bg-hijau-tua"
      : variant === "bahaya"
        ? "bg-red-600 text-white"
        : "border border-garis bg-white text-stone-800 active:bg-stone-100";
  return (
    <button
      {...p}
      className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-coklat">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

const inputCls = "min-h-11 w-full rounded-xl border border-garis bg-white px-3 text-base outline-none focus:border-hijau focus:ring-2 focus:ring-hijau/20";
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${inputCls} ${p.className ?? ""}`} />;

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const teks = error instanceof Error ? error.message : String(error);
  return <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{teks}</p>;
}

export function Memuat({ teks = "Memuat…" }: { teks?: string }) {
  return <p className="py-8 text-center text-sm text-stone-500">{teks}</p>;
}

export function Baris({ kiri, kanan, tebal }: { kiri: ReactNode; kanan: ReactNode; tebal?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 text-sm ${tebal ? "font-semibold" : ""}`}>
      <span className="text-stone-700">{kiri}</span>
      <span className="shrink-0 tabular-nums">{kanan}</span>
    </div>
  );
}

export function Progress({ nilai, maks }: { nilai: number; maks: number }) {
  const persen = maks > 0 ? Math.max(0, Math.min(100, (nilai / maks) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={Math.round(persen)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-hijau" style={{ width: `${persen}%` }} />
    </div>
  );
}

/** Tabel sungguhan di semua ukuran layar: di layar sempit digulir ke samping (bukan diubah jadi kartu). */
export function Tabel({ children, minLebar = 520, className = "" }: { children: ReactNode; minLebar?: number; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-garis bg-white ${className}`}>
      <table className="w-full border-collapse text-sm" style={{ minWidth: minLebar }}>
        {children}
      </table>
    </div>
  );
}

interface SelProps {
  kanan?: boolean;
  /** Kolom pertama tetap terlihat saat tabel digulir ke samping. */
  lengket?: boolean;
  tebal?: boolean;
  className?: string;
  colSpan?: number;
  children?: ReactNode;
}

export function Th({ kanan, lengket, className = "", colSpan, children }: SelProps) {
  return (
    <th
      colSpan={colSpan}
      className={`whitespace-nowrap bg-stone-50 px-3 py-2 text-xs font-semibold text-coklat ${kanan ? "text-right" : "text-left"} ${lengket ? "sticky left-0 z-[1] min-w-[7rem]" : ""} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ kanan, lengket, tebal, className = "", colSpan, children }: SelProps) {
  return (
    <td
      colSpan={colSpan}
      className={`border-t border-garis px-3 py-2 align-top ${kanan ? "whitespace-nowrap text-right tabular-nums" : ""} ${tebal ? "font-semibold" : ""} ${lengket ? "sticky left-0 min-w-[7rem] bg-white" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export function TdTotal({ kanan, lengket, colSpan, children }: SelProps) {
  return (
    <td
      colSpan={colSpan}
      className={`border-t-2 border-stone-400 bg-stone-50 px-3 py-2 font-semibold ${kanan ? "whitespace-nowrap text-right tabular-nums" : ""} ${lengket ? "sticky left-0" : ""}`}
    >
      {children}
    </td>
  );
}

export const Kosong = ({ teks }: { teks: string }) => <p className="py-4 text-center text-sm text-stone-500">{teks}</p>;

export const Teks = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`min-h-20 w-full rounded-xl border border-garis bg-white px-3 py-2 text-base outline-none focus:border-hijau focus:ring-2 focus:ring-hijau/20 ${p.className ?? ""}`} />
);

/** Jendela formulir: dari bawah di HP, di tengah di laptop. Esc menutup. */
export function Dialog({ judul, onTutup, children }: { judul: string; onTutup: () => void; children: ReactNode }) {
  useEffect(() => {
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && onTutup();
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [onTutup]);
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center" role="dialog" aria-modal="true" aria-label={judul}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl md:max-w-xl md:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{judul}</h2>
          <button onClick={onTutup} className="min-h-11 min-w-11 text-xl text-stone-500" aria-label="Tutup">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ daftar, aktif, onPilih }: { daftar: { id: T; label: string }[]; aktif: T; onPilih: (id: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-200 p-1" role="tablist">
      {daftar.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={aktif === t.id}
          onClick={() => onPilih(t.id)}
          className={`min-h-10 whitespace-nowrap rounded-lg px-4 text-sm font-semibold ${aktif === t.id ? "bg-white text-hijau shadow-sm" : "text-stone-600"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Lencana({ children, warna = "abu" }: { children: ReactNode; warna?: "hijau" | "oranye" | "merah" | "abu" }) {
  const w = { hijau: "bg-hijau-muda text-hijau", oranye: "bg-oranye-muda text-coklat", merah: "bg-red-50 text-red-700", abu: "bg-stone-100 text-stone-600" }[warna];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${w}`}>{children}</span>;
}
