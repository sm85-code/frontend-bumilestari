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

## Halaman
| Rute | Peran | Isi |
|---|---|---|
| `/masuk`, `/akun` | semua | Login; ganti password (wajib bila password masih bawaan) |
| `/` | admin, owner | Beranda: total kas, laba, bayar tukang Selasa ini, tagihan penjual lain, order, kas kecil/iklan, bagi hasil |
| `/selasa` | admin, owner | Langkah mingguan berurutan: terima bayar, tarik saldo toko, isi kas kecil/iklan (iklan hanya admin), sisihkan dana gaji, bayar tukang |
| `/order` | admin, owner | Daftar order, order baru, pindah status (alur kayu/non kayu/polos), batalkan |
| `/pesanan-tukang` | admin, owner | Siap dibayar per tukang/supplier, **Kirim ke laporan** (1 transaksi + rincian), PDF/WhatsApp PO, riwayat |
| `/penjual-lain` | admin, owner | Invoice mingguan per penjual lain (PDF, WhatsApp), catat pembayaran diterima, riwayat |
| `/keuangan` | admin, owner | Saldo akun, catat/batalkan transaksi |
| `/kas-kecil` | semua | Saldo, catat pengeluaran, riwayat (staf hanya melihat ini dan laporannya) |
| `/gaji` | admin, owner | Karyawan tetap, gaji bulanan (siapkan/bayar), langganan dan tagihan |
| `/bagi-hasil` | admin, owner | Pratinjau, simpan, bayar bagi hasil admin/owner |
| `/laporan`, `/laporan/kas-kecil` | admin, owner / semua | Laporan umum; laporan kas kecil + cek uang fisik |
| `/master` | admin, owner | Produk, tukang & supplier, penjual lain, harga grosir, saluran, akun & kategori, pengguna (admin), profil UMKM + proporsi bagi hasil (ubah: admin) |
| `/lainnya` | admin, owner | Menu lengkap di HP |

Laporan kas iklan terpisah dikerjakan admin nanti (backend belum membukanya).

Logo: `public/logo.png` (sementara; ganti dengan logo final, ikon PWA di `public/icon-*.png`).
