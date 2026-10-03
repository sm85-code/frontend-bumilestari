import { useState, type ChangeEvent } from "react";

type Elemen = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** State formulir sederhana: `bind("nama")` menghasilkan {value, onChange} untuk Input/Select; `bindNilai` untuk DatePicker. */
export function useFields<T extends Record<string, string>>(awal: T) {
  const [f, setF] = useState<T>(awal);
  const bind = (k: keyof T) => ({
    value: f[k],
    onChange: (e: ChangeEvent<Elemen>) => setF((s) => ({ ...s, [k]: e.target.value })),
  });
  const bindNilai = (k: keyof T) => ({
    value: f[k],
    onChange: (v: string) => setF((s) => ({ ...s, [k]: v })),
  });
  return { f, setF, bind, bindNilai, reset: () => setF(awal) };
}
