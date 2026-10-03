# Frontend Bumi Lestari

Aplikasi web (PWA) untuk keuangan UMKM dan pengelolaan order Bumi Lestari.
Backend: [`sm85-code/sm85-arch`](https://github.com/sm85-code/sm85-arch), tenant `bumi_lestari` (`/api/bumi-lestari`).

## Teknologi
React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query, React Router, vite-plugin-pwa.

## Prinsip tampilan
- **Bukan mobile-first**: dipakai di laptop dan HP. Laptop (lebar ≥768px) memakai menu samping dan area konten lebar; HP memakai
  header ringkas dan navigasi bawah.
- **Data tabular selalu tabel**, termasuk di HP (digulir ke samping, kolom pertama tetap terlihat). Tidak diubah menjadi kartu
  supaya data tetap terbaca menyeluruh. Gunakan komponen `Tabel`, `Th`, `Td`, `TdTotal` di `src/components/ui.tsx`.
- Kartu hanya untuk ringkasan angka (mis. Beranda).

## Menjalankan
```bash
npm install
cp .env.example .env     # isi VITE_API_PROXY (dev) atau VITE_API_URL (produksi)
npm run dev              # http://localhost:5173
npm test                 # tes unit (vitest)
npm run build            # tsc + vite build -> dist/
```

- **Dev:** isi `VITE_API_PROXY` dengan alamat backend; Vite meneruskan `/api` ke sana sehingga cookie login berjalan tanpa CORS.
- **Produksi:** isi `VITE_API_URL` dengan alamat backend. Alamat frontend harus ditambahkan ke `CORS_ORIGINS` di backend
  (login memakai cookie lintas situs, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`).

## Halaman yang sudah ada
| Rute | Peran | Isi |
|---|---|---|
| `/masuk` | semua | Login |
| `/akun` | semua | Ganti password (wajib bila password masih bawaan), keluar |
| `/` | admin, owner | Beranda: total kas, laba bulan ini, bayar tukang Selasa ini, tagihan penjual lain, order, kas kecil/iklan, bagi hasil |
| `/keuangan` | admin, owner | Saldo akun, catat transaksi, riwayat, batalkan transaksi |
| `/kas-kecil` | semua | Saldo kas kecil, catat pengeluaran, riwayat (staf hanya melihat ini) |
| `/laporan` | admin, owner | Laporan umum: pemasukan, biaya, laba, arus kas |
| `/laporan/kas-kecil` | semua | Laporan kas kecil bulanan, rincian mingguan, cek selisih uang fisik |

Staf pemegang kas kecil otomatis diarahkan ke Kas kecil. Kas iklan hanya tampil untuk admin (diatur backend).

## Berikutnya
Order dan pesanan ke tukang, penjual lain (invoice + kirim WhatsApp), siklus Selasa, gaji dan langganan, bagi hasil,
halaman master (produk, tukang, penjual lain, pengguna, profil).

Logo: `public/logo.png` (sementara; ganti dengan logo final, ikon PWA di `public/icon-*.png`).
