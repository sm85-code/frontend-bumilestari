/** Wallpaper ripple: lingkaran konsentris berdenyut di belakang konten. Tidak menerima klik. */
export default function Wallpaper({ ukuranAwal = 220, jumlah = 7, opasitas = 0.3 }: { ukuranAwal?: number; jumlah?: number; opasitas?: number }) {
  return (
    <div className="wallpaper-layer" aria-hidden="true">
      <div className="absolute inset-0">
        {Array.from({ length: jumlah }, (_, i) => {
          const ukuran = ukuranAwal + i * 80;
          return (
            <div
              key={i}
              className="wallpaper-ripple-circle"
              style={{ width: ukuran, height: ukuran, animationDelay: `${i * 0.3}s`, ["--ripple-opacity" as string]: opasitas - i * 0.03 }}
            />
          );
        })}
      </div>
    </div>
  );
}
