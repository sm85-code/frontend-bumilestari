import { describe, expect, it } from "vitest";
import { ApiError, PESAN_BELUM_SIAP, isSetoranKedua, pesanError } from "./api";

describe("pesan error ramah", () => {
  it("tidak menampilkan istilah teknis seed-now", () => {
    expect(pesanError({ detail: "Akun kas kecil belum dibuat (jalankan seed-now)" }, 409)).toBe(PESAN_BELUM_SIAP);
    expect(pesanError({ detail: "Kategori 'Gaji karyawan' belum ada (jalankan seed-now)" }, 409)).toBe(PESAN_BELUM_SIAP);
    expect(pesanError({ detail: "Akun kas kecil belum dibuat (jalankan seed-now)" }, 409)).not.toMatch(/seed/i);
  });
  it("saldo tidak cukup diberi petunjuk", () => {
    expect(pesanError({ detail: "Saldo Kas kecil tidak cukup" }, 400)).toBe("Saldo Kas kecil tidak cukup untuk jumlah ini. Periksa jumlahnya atau hubungi admin.");
  });
  it("validasi diterjemahkan", () => {
    expect(pesanError({ detail: [{ loc: ["body", "jumlah"], msg: "Input should be greater than 0" }] }, 422)).toBe("Jumlah: harus lebih dari 0");
    expect(pesanError({ detail: [{ loc: ["body", "kategori_id"], msg: "Field required" }] }, 422)).toBe("Kategori: wajib diisi");
    expect(pesanError({ detail: [{ loc: ["body", "new_password"], msg: "Value error, Password minimal 8 karakter" }] }, 422)).toBe(
      "Kata sandi baru: Password minimal 8 karakter",
    );
  });
  it("status tanpa detail", () => {
    expect(pesanError(null, 401)).toMatch(/masuk lagi/);
    expect(pesanError(null, 500)).toMatch(/hubungi admin/);
    expect(pesanError({ detail: "Pesan biasa" }, 400)).toBe("Pesan biasa");
    expect(pesanError({ detail: "Email atau password salah" }, 401)).toBe("Email atau kata sandi salah.");
  });
  it("pesan aturan Fase 1 dibuat ramah", () => {
    expect(pesanError({ detail: "Kategori 'Bagi hasil' belum ada. Aplikasi belum siap dipakai, hubungi admin." }, 409)).toBe(PESAN_BELUM_SIAP);
    expect(pesanError({ detail: "Sesi berakhir, silakan login lagi" }, 401)).toMatch(/masuk lagi/);
    expect(pesanError({ detail: "Entri ini sudah dikirim ke laporan keuangan; batalkan kirimannya dulu" }, 409)).toMatch(/Riwayat kiriman/);
    expect(pesanError({ detail: "Transaksi otomatis; batalkan dari halaman asalnya" }, 409)).toMatch(/halaman asalnya/);
    expect(pesanError({ detail: "Kategori 'Gaji karyawan' diisi otomatis oleh aplikasi dan tidak bisa dipakai di catatan manual" }, 422)).toBe(
      "Kategori 'Gaji karyawan' diisi otomatis oleh aplikasi, jadi tidak bisa dipilih di catatan manual. Pilih kategori lain.",
    );
    expect(pesanError({ detail: "Order sudah masuk pembayaran tukang & supplier; keluarkan dulu dari draf (atau batalkan kirimannya) untuk mengubahnya" }, 409)).toMatch(
      /Batalkan pembayarannya dulu/,
    );
  });
  it("mengenali 409 setoran modal kedua", () => {
    const e = new ApiError(409, pesanError({ detail: "Setoran modal sudah pernah dicatat. Konfirmasi bila ini memang setoran modal tambahan." }, 409));
    expect(isSetoranKedua(e)).toBe(true);
    expect(isSetoranKedua(new ApiError(409, "Lain"))).toBe(false);
  });
});
