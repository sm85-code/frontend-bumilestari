import { createContext, useContext, useState, type ReactNode } from "react";
import { Modal } from "antd";
import { Plus } from "lucide-react";
import { Button } from "./UI";

const CloseContext = createContext(() => {});
export const useCloseFinanceDialog = () => useContext(CloseContext);

export function InputDialog({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}><span className="flex items-center gap-2"><Plus size={16} aria-hidden="true" />{label}</span></Button><Modal title={title} open={open} onCancel={() => setOpen(false)} footer={null} width={760} styles={{ body: { maxHeight: '72dvh', overflowY: 'auto', paddingTop: 16 } }}><CloseContext.Provider value={() => setOpen(false)}>{children}</CloseContext.Provider></Modal></>;
}
export function FinanceTabs<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: readonly (readonly [T, string])[]; onChange: (value: T) => void }) {
  return <div role="tablist" aria-label={label} className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">{items.map(([key, name]) => <button type="button" role="tab" aria-selected={value === key} key={key} onClick={() => onChange(key)} className={`shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${value === key ? 'bg-white text-emerald-900 shadow-sm' : 'text-stone-600 hover:bg-white/60'}`}>{name}</button>)}</div>;
}
