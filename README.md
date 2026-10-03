# Frontend Bumi Lestari

Aplikasi web (PWA) untuk keuangan UMKM dan pengelolaan order Bumi Lestari.
Backend: [`sm85-code/sm85-arch`](https://github.com/sm85-code/sm85-arch), tenant `bumi_lestari` (`/api/bumi-lestari`).

## Teknologi
React 19, Vite, TypeScript (strict), Ant Design 6, TanStack Query, React Router, vite-plugin-pwa. Tes: Vitest (unit) dan
Playwright (klik/e2e dengan API tiruan).

## Prinsip tampilan
- **Bukan mobile-first**: dipakai di laptop dan HP. Laptop (lebar ≥768px) memakai menu samping dan area konten lebar; HP memakai
  header ringkas dan navigasi bawah.
- **Data tabular selalu tabel**, termasuk di HP (digulir ke samping, kolom pertama tetap terlihat). Tidak diubah menjadi kartu
  supaya data tetap terbaca menyeluruh. Gunakan komponen `DataTabel` dan `BarisTotal` di `src/components/ui.tsx`.
- Kartu hanya untuk ringkasan angka (mis. Beranda).

## Menjalankan
```bash
npm install
cp .env.example .env     # isi VITE_API_PROXY (dev) atau VITE_API_URL (produksi)
npm run dev              # http://localhost:5173
npm test                 # tes unit (vitest)
npm run build && npm run test:e2e   # tes klik Playwright dengan API tiruan (laptop + HP); CI menjalankannya otomatis.
                         # Tanpa Chromium bawaan Playwright: PW_CHROMIUM_PATH=/path/ke/chromium npm run test:e2e
npm run build            # tsc + vite build -> dist/
```

- **Dev:** isi `VITE_API_PROXY` dengan alamat backend; Vite meneruskan `/api` ke sana sehingga cookie login berjalan tanpa CORS.
- **Produksi:** isi `VITE_API_URL` dengan alamat backend. Alamat frontend harus ditambahkan ke `CORS_ORIGINS` di backend
  (login memakai cookie lintas situs, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`).

## Istilah
Dipakai konsisten di semua layar (glosarium spesifikasi alur keuangan): **Penjual lain** (bukan reseller), **Tukang & supplier**
(bukan pemasok), **Plafon** (batas saldo Kas kecil/Kas iklan, bukan jatah), **Kas utama**, **Dana cadangan** (sisihan gaji,
tidak dihitung sebagai kas yang bisa dipakai), **Tagihan rutin** (langganan & utilitas), **Profil saya**, **Kata sandi**.

## Menu
Menu dikelompokkan; URL tidak berubah.

| Grup | Menu | Rute | Isi |
|---|---|---|---|
| Mingguan | Beranda | `/` | Kas bisa dipakai vs Dana cadangan, laba bulan ini, bayar tukang Selasa ini, tagihan penjual lain jatuh tempo Selasa ini (dan semua yang belum dibayar), **Yang perlu dikerjakan**, akun kas, order bulan ini + status semua order (sepanjang waktu), kas kecil/iklan, pratinjau bagi hasil |
| Mingguan | Tutup Kas Mingguan | `/selasa` | Wizard langkah demi langkah, biasanya tiap Selasa (Selesai/Belum/Dilewati): 1 terima bayar penjual lain, 2 pencairan marketplace *(segera hadir)*, 3 tarik saldo ke Kas utama, 4 bayar tukang & supplier, 5 lunasi talangan *(segera hadir)*, 6 sisihkan dana gaji, 7 isi kas kecil & kas iklan (iklan hanya admin) |
| Penjualan | Order | `/order` | Daftar order, order baru, pindah status (alur kayu/non kayu/polos), batalkan |
| Penjualan | Tagihan penjual lain | `/penjual-lain` | Invoice mingguan per penjual lain (PDF, WhatsApp), catat pembayaran diterima (tanggal bisa dipilih), riwayat |
| Pembelian | Bayar tukang & supplier | `/pesanan-tukang` | Siap dibayar per tukang & supplier, **Catat pembayaran** (1 transaksi + rincian), PDF/WhatsApp rekap, riwayat |
| Uang | Kas & transaksi | `/keuangan` | Saldo akun kas & plafon, riwayat transaksi dan transfer. Sebagian besar tercatat otomatis; **Catat manual** hanya untuk yang jarang |
| Uang | Kas kecil | `/kas-kecil` | Saldo, catat pengeluaran, riwayat |
| Uang | Gaji & tagihan rutin | `/gaji` | Karyawan tetap, gaji bulanan (siapkan/bayar, tanggal bisa dipilih), tagihan rutin |
| Uang | Bagi hasil | `/bagi-hasil` | Pratinjau, simpan, bayar bagi hasil admin/owner (tanggal bisa dipilih) |
| Laporan | Laba rugi | `/laporan` | Laporan umum bulanan |
| Laporan | Kas kecil | `/laporan/kas-kecil` | Laporan kas kecil per bulan + cek uang fisik |
| Pengaturan | Data master | `/master` | Produk, tukang & supplier, penjual lain, harga grosir, saluran, akun kas & kategori, pengguna (admin), profil UMKM + proporsi bagi hasil (ubah: admin) |
| Pengaturan | Profil saya | `/akun` | Data diri, ganti kata sandi (wajib bila masih bawaan) |

Di HP: navigasi bawah Beranda, Order, Tutup kas, Kas, **Lainnya** (`/lainnya`, berisi menu lengkap per grup).

**Menu staf** (peran `staff`): **Kas kecil** (`/kas-kecil`: saldo besar, Catat pengeluaran dengan 4 tombol kategori, 10 catatan
terakhir, tanpa tombol batal — "Salah catat? Minta admin membatalkan."), **Riwayat bulan ini** (`/laporan/kas-kecil`, bulan
berjalan), **Profil saya** (`/akun`, termasuk tombol buka panduan). Panduan hari pertama tampil sekali per pengguna (disimpan di
`localStorage`).

## Aturan kategori (form manual)
Diatur di `src/lib/kategori.ts` (nama dicocokkan dengan seeder backend):
- Tidak ada kategori bawaan: form menampilkan "Pilih kategori" dan tombol Simpan aktif setelah kategori dipilih.
- Staf / pengeluaran dari Kas kecil: hanya **Transport, Packing, Operasional, Lainnya** (Pengeluaran lain).
- Kas & transaksi menyembunyikan **kategori sistem** yang dicatat otomatis dari halaman asalnya: Bagi hasil, Gaji karyawan,
  Biaya produksi / pembelian barang, Langganan & utilitas (Tagihan rutin), Penjualan reseller (Penjualan penjual lain).
- Pemasukan **marketplace** (mis. Penjualan marketplace / Shopee) juga disembunyikan: nanti hanya masuk dari impor file Excel
  marketplace.
- Transaksi otomatis (`ref_jenis` terisi) dan transfer sisihan dana tidak bisa dibatalkan dari Kas & transaksi; tampil
  "Otomatis dari …" dengan tautan ke halaman asal.

Catatan: aturan di atas baru ditegakkan di frontend; backend menyusul (Fase 1). Status langkah Tutup Kas Mingguan yang ditandai
manual (Tandai selesai / Lewati) dan tanda "cek fisik kas kecil" di Beranda sementara disimpan di `localStorage` perangkat.

Laporan kas iklan terpisah dikerjakan admin nanti (backend belum membukanya).

Logo: `public/logo.png` (sementara; ganti dengan logo final, ikon PWA di `public/icon-*.png`).
