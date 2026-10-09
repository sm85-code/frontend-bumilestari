# Keuangan workspace

The finance page now has three main tabs: Kas Operasional, Laporan Produksi and
Laporan Utama. Primary tab selection survives refresh in the URL. Existing report
URLs redirect into the consolidated workspace.

Operational transactions use existing keu expense endpoints. Production shows
outstanding vendor debt and payment history, with payment input in a dialog.
Main reports reuse posted-ledger calculations; manual receipts and settlement
reconciliation remain available alongside reports. Cash transfers and technical
journals are available under Buku kas & transfer, without permanent input forms.

Input dialogs use Ant Design focus management, Escape/close support and scrollable
mobile bodies. Successful financial inputs close their dialogs; failed submissions remain open.

This change reorganizes the frontend only. It does not change accounting policy,
weekly cash/advertising replenishment budgets, salary recognition, manual inventory
valuation or ERP/Store synchronization. Production reporting currently exposes
outstanding debt and actual payment history, not a new per-order debt aging report.
Legacy tables and routes outside the consolidated reports are untouched.

Validation: production build, eight API/decimal unit checks, mocked-browser checks
at 390px and 1440px for dialogs, reports and overflow. Production database and live
financial records were not accessed.
