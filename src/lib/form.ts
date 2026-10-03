import { useState, type ChangeEvent } from "react";

type Elemen = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** State formulir sederhana: `bind("nama")` menghasilkan {value, onChange} untuk Input/Select. */
export function useFields<T extends Record<string, string>>(awal: T) {
  const [f, setF] = useState<T>(awal);
  const bind = (k: keyof T) => ({
    value: f[k],
    onChange: (e: ChangeEvent<Elemen>) => setF((s) => ({ ...s, [k]: e.target.value })),
  });
  return { f, setF, bind, reset: () => setF(awal) };
}
