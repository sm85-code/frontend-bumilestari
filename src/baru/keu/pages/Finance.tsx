import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { money, useChoices } from "../api";
import type { VendorDebt } from "../types";
import { BookNotice, useBook } from "../components/BookSettings";
import { FinanceTabs } from "../components/FinanceUI";
import { Empty, ErrorMessage, Heading, Loading, Panel, Table } from "../components/UI";
import LedgerFinance from "../components/LedgerFinance";
import { Workspace } from "./Expenses";
import Reports from "./Reports";
import FinanceRecords from "./FinanceRecords";

const tabs = [['operasional', 'Kas Operasional'], ['produksi', 'Laporan Produksi'], ['utama', 'Laporan Utama']] as const;
const operationTabs = [['operasional', 'Transaksi operasional'], ['bahan', 'Bahan pendukung'], ['gaji_iklan', 'Gaji & Iklan'], ['buku', 'Buku kas & transfer']] as const;
export default function Finance() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = requested === 'produksi' || requested === 'utama' ? requested : 'operasional';
  function setTab(value: typeof tabs[number][0]) { setParams(current => { const next = new URLSearchParams(current); next.set('tab', value); return next; }); }
  const [operation, setOperation] = useState<typeof operationTabs[number][0]>('operasional');
  const [main, setMain] = useState<'laporan' | 'penerimaan'>('laporan');
  const book = useBook();
  return <><Heading title="Keuangan" /><FinanceTabs label="Keuangan" value={tab} items={tabs} onChange={setTab} /><div role="tabpanel" aria-label={tabs.find(([key]) => key === tab)?.[1]}>
    {tab === 'operasional' ? <><BookNotice />{book.data?.aktif && <><FinanceTabs label="Pencatatan kas" value={operation} items={operationTabs} onChange={setOperation} />{operation === 'buku' ? <LedgerFinance /> : <Panel title={operationTabs.find(([key]) => key === operation)?.[1] ?? ''}><Workspace key={operation} tab={operation} /></Panel>}</>}</> : tab === 'produksi' ? <><BookNotice />{book.data?.aktif && <><ProductionDebts /><Panel title="Pembayaran produksi"><Workspace tab="vendor" /></Panel></>}</> : <><FinanceTabs label="Laporan dan penerimaan" value={main} items={[['laporan','Laporan keuangan'],['penerimaan','Penerimaan & pencairan']]} onChange={setMain} />{main === 'laporan' ? <Reports embedded /> : <FinanceRecords />}</>}
  </div></>;
}
function ProductionDebts() {
  const debts = useChoices<VendorDebt>('/utang-vendor');
  return <Panel title="Tagihan Tukang Kayu & Supplier"><ErrorMessage error={debts.error} />{debts.isLoading ? <Loading /> : !debts.data?.length ? <Empty>Belum ada tagihan produksi.</Empty> : <Table headers={['Tukang Kayu / Supplier', 'Sisa Tagihan']}>{debts.data.map(row => <tr key={row.id} className="border-b"><td>{row.nama}</td><td className="text-right whitespace-nowrap">{money(row.utang)}</td></tr>)}</Table>}</Panel>;
}
