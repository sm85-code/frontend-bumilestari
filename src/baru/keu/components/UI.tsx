import { LoaderCircle } from "lucide-react";
import { Children, cloneElement, isValidElement, useId, type ReactNode } from "react";

export function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return <header className="mb-6"><h1 className="text-2xl font-semibold text-emerald-950">{title}</h1>{children && <details className="mt-2 text-sm text-stone-600"><summary className="cursor-pointer py-2">Bantuan</summary><p className="pt-2 leading-relaxed">{children}</p></details>}</header>;
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-5 min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? <p role="alert" className="my-3 rounded-lg bg-red-50 px-5 py-4 leading-relaxed text-sm text-red-800">{error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi."}</p> : null;
}
export function Button({ children, className = "", variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" }) {
  const colors = variant === "outline" ? "border-stone-300 bg-white text-stone-700 hover:bg-stone-100" : variant === "danger" ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100" : "border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900";
  return <button type="button" {...props} className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${colors} ${className}`}>{children}</button>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const generated = useId();
  const control = isValidElement<{ id?: string }>(children) ? children : null;
  const id = control?.props.id ?? generated;
  return <div className="flex min-w-0 flex-col gap-2 text-sm"><label htmlFor={id} className="font-medium text-stone-700">{label}</label>{control ? cloneElement(control, { id }) : children}</div>;
}
export const inputClass = "min-h-11 min-w-0 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm";
export function Loading() { return <div role="status" aria-label="Memuat data" className="flex min-h-32 items-center justify-center p-5"><LoaderCircle aria-hidden="true" className="size-6 animate-spin text-emerald-800 motion-reduce:animate-none" /><span className="sr-only">Memuat data…</span></div>; }
export function Empty({ children = "Belum ada data." }: { children?: ReactNode }) { return <p className="p-3 text-sm text-stone-500">{children}</p>; }
export function Pager({ offset, total, onChange }: { offset: number; total: number; onChange: (offset: number) => void }) {
  if (total <= 50 && offset === 0) return <p className="mt-4 text-sm text-stone-500">{total ? 1 : 0}–{total} dari {total}</p>;
  return <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><Button variant="outline" disabled={!offset} onClick={() => onChange(Math.max(0, offset - 50))}>Sebelumnya</Button><span>{total ? offset + 1 : 0}–{Math.min(total, offset + 50)} dari {total}</span><Button variant="outline" disabled={offset + 50 >= total} onClick={() => onChange(offset + 50)}>Berikutnya</Button></div>;
}
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  const numeric = new Set(["jumlah", "saldo", "harga", "harga satuan", "total", "neto", "hpp", "kuantitas", "debit", "kredit", "biaya per unit", "nilai", "masuk", "keluar"]);
  const indices = headers.map((header, index) => numeric.has(header.toLowerCase()) ? index : -1);
  return <div role="region" aria-label="Tabel data" tabIndex={0} className="keu-table min-w-0 overflow-x-auto overscroll-x-contain rounded-xl border border-stone-200"><table className="w-full text-left text-sm"><thead><tr>{headers.map(header => <th key={header} className={`whitespace-nowrap border-b px-3 py-2 font-semibold text-emerald-950 ${numeric.has(header.toLowerCase()) ? "text-right" : ""}`}>{header}</th>)}</tr></thead><tbody>{Children.map(children, row => isValidElement<{ children?: ReactNode }>(row) && row.type === "tr" ? cloneElement(row, {}, Children.map(row.props.children, (cell, index) => indices.includes(index) && isValidElement<{ className?: string }>(cell) ? cloneElement(cell, { className: `${cell.props.className ?? ""} text-right whitespace-nowrap tabular-nums` }) : cell)) : row)}</tbody></table></div>;
}
