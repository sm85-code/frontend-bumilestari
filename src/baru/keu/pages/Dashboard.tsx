import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { keu, money } from "../api";
import type { Dashboard as Summary } from "../types";
import { Button, ErrorMessage, Heading, Loading, Panel } from "../components/UI";

export default function Dashboard() {
  const result = useQuery({ queryKey: ["keu", "dashboard"], queryFn: ({ signal }) => keu<Summary>("/dashboard", { signal }) });
  const d = result.data;
  return <><Heading title="Dashboard">Kas hanya menghitung transaksi terkirim. Nilai pesanan ditampilkan terpisah dari penerimaan kas.</Heading><ErrorMessage error={result.error} />{result.isLoading ? <Loading /> : result.isError ? <Button onClick={() => void result.refetch()}>Coba lagi</Button> : d && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Saldo kas", money(d.saldo_kas)], ["Kas masuk", money(d.kas_masuk)], ["Kas keluar", money(d.kas_keluar)], ["Nilai pesanan", money(d.nilai_pesanan)], ["Biaya vendor dialokasikan", money(d.biaya_vendor)], ["Pesanan", String(d.pesanan)]].map(([label, value]) => <Panel key={label} title={label}><p className="break-words text-xl font-semibold text-emerald-900">{value}</p></Panel>)}</div><Panel title="Perlu ditinjau"><ul className="space-y-3 text-sm"><li><Link to="/order">{d.belum_dipetakan} item belum dipetakan</Link></li><li><Link to="/keuangan">{d.settlement_draf} settlement draf</Link></li><li><Link to="/sinkronisasi">{d.masukan_gagal} masukan gagal</Link></li></ul></Panel></>}</>;
}
