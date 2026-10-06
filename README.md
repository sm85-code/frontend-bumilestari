# BUMI Lestari

Frontend React/Vite untuk `keu.ampelkuning.com`. Entrypoint `src/main.tsx` memakai `src/baru/AppBaru.tsx`; modul aktif berada di `src/baru/keu` dan terhubung ke `/api/bumi-lestari/keu` pada backend `sm85-arch`.

## Jalankan dan build

```sh
npm ci
cp .env.example .env
npm run dev
```

- Development: isi `VITE_API_PROXY` dengan origin backend; proxy Vite meneruskan `/api`.
- DigitalOcean Static Site: isi `VITE_API_URL` pada environment **build** dengan origin backend, build `npm run build`, output `dist`. Tambahkan `https://keu.ampelkuning.com` pada environment `CORS_ORIGINS` backend dengan mempertahankan origin lain. API memakai cookie existing dan `credentials: include`.
- Deploy backend keu dan verifikasi migrasinya sebelum mengaktifkan FE ini. CI bukan verifikasi database Neon/live deployment.

## Modul aktif

| Route | Fungsi |
| --- | --- |
| `/` | Dashboard keu: kas posted, nilai pesanan, estimasi biaya vendor, antrian |
| `/order` | Pesanan manual, pemetaan item sumber ke produk, status produksi |
| `/produksi` | Alokasi kuantitas/biaya vendor dan pembatalan dengan alasan |
| `/keuangan` | Draf kas manual, posting, rekonsiliasi dan posting settlement neto |
| `/impor` | Template CSV, pratinjau CSV/XLSX, penerapan batch, riwayat |
| `/sinkronisasi` | Pull Store/ERP inkremental maksimal 100 data, tinjau/retry inbox |
| `/pengaturan` | Produk, akun, pelanggan UMKM/reseller, saluran, delapan slot vendor |
| `/akun` | Profil, ganti kata sandi, logout |
| `/kas-kecil` | Kas kecil existing untuk staff |

`Protected` memerlukan session. `PasswordRequired` mengarahkan pengguna dengan kata sandi bawaan ke `/akun`. `FinanceOnly` hanya mengizinkan owner/admin; staff diarahkan ke `/kas-kecil`. Backend menerapkan role/password guard juga. Respons 401 mengakhiri session FE dan membersihkan query cache; pergantian pengguna membersihkan data pengguna sebelumnya.

Nominal tetap string desimal dari API. Format uang dan perkalian harga memakai string/BigInt, bukan floating point. Pencatatan draf belum memengaruhi kas. Settlement hanya diposting setelah alokasi neto lengkap; posting berulang tidak menggandakan kas.

Slot `tk-1`–`tk-5` dan `sup-1`–`sup-3` berasal dari DB; nama/kontak diisi pengguna, bukan default yang dikarang. Data lama `bl_*`/`bl2_*` tidak otomatis dimasukkan ke saldo keu. Modul lama yang tidak dimount tetap tersedia dalam source; tes lama yang sebelumnya sudah dinonaktifkan tidak diaktifkan pada refactor ini.

Import menggunakan template keu, maksimal 5 MB/10.000 baris, tanpa formula Excel. File gagal validasi tidak dapat diterapkan. Referensi DB diperiksa saat penerapan dan seluruh batch rollback jika satu referensi gagal. Pull dipicu pengguna, belum scheduler otomatis. Store hanya menyediakan order pada integrasi ini, bukan bukti pencairan settlement.

## Verifikasi

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E memakai API tiruan pada build produksi, dengan viewport laptop dan mobile. Jika Chromium tersedia dari sistem, gunakan `PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e`. Tes mencakup menu, role/password guard, nominal presisi, slot vendor, impor invalid, dan penolakan posting settlement yang belum rekonsiliasi.

Dokumentasi backend lengkap: `sm85-arch/docs/keu-stage4.md`. Alur iPaymu tidak diubah oleh modul keu ini.
