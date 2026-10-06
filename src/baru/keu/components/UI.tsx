import { cloneElement, isValidElement, useId, type ReactNode } from "react";

export function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return <header className="mb-6"><h1 className="text-2xl font-semibold text-emerald-950">{title}</h1>{children && <p className="mt-2 text-sm text-stone-600">{children}</p>}</header>;
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? <p role="alert" className="my-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi."}</p> : null;
}
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="rounded-lg border border-emerald-800 bg-emerald-800 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const generated = useId();
  const control = isValidElement<{ id?: string }>(children) ? children : null;
  const id = control?.props.id ?? generated;
  return <div className="flex min-w-0 flex-col gap-1 text-sm"><label htmlFor={id} className="font-medium text-stone-700">{label}</label>{control ? cloneElement(control, { id }) : children}</div>;
}
export const inputClass = "min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
export function Loading() { return <p role="status" className="p-3 text-sm text-stone-600">Memuat data…</p>; }
export function Empty({ children = "Belum ada data." }: { children?: ReactNode }) { return <p className="p-3 text-sm text-stone-500">{children}</p>; }
export function Pager({ offset, total, onChange }: { offset: number; total: number; onChange: (offset: number) => void }) {
  return <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><Button disabled={!offset} onClick={() => onChange(Math.max(0, offset - 50))}>Sebelumnya</Button><span>{total ? offset + 1 : 0}–{Math.min(total, offset + 50)} dari {total}</span><Button disabled={offset + 50 >= total} onClick={() => onChange(offset + 50)}>Berikutnya</Button></div>;
}
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{headers.map(header => <th key={header} className="whitespace-nowrap border-b px-3 py-2 font-medium text-stone-500">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
