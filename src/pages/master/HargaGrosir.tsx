import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Card, Dialog, ErrorBox, Field, Input, Kosong, Select, Tabel, Td, Th } from "../../components/ui";
import { api, query } from "../../lib/api";
import { useAksi, usePelanggan, useProduk } from "../../lib/data";
import { useFields } from "../../lib/form";
import { bersihkanAngka, num, rp } from "../../lib/format";
import type { HargaGrosir, Produk } from "../../lib/types";

function Form({ produk, pelangganId, awal, onSelesai }: { produk: Produk; pelangganId: string; awal?: HargaGrosir; onSelesai: () => void }) {
  const aksi = useAksi();
  const angka = (v?: string) => (v ? String(Math.round(num(v))) : "");
  const { f, bind } = useFields({ harga: angka(awal?.harga), cat: angka(awal?.harga_cat_jasa), biasa: angka(awal?.harga_packing_biasa), kayu: angka(awal?.harga_packing_kayu) });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        aksi.mutate(
          {
            path: "/harga-grosir",
            method: "PUT",
            body: {
              produk_id: produk.id, pelanggan_id: pelangganId, harga: bersihkanAngka(f.harga) || "0",
              harga_cat_jasa: bersihkanAngka(f.cat) || "0", harga_packing_biasa: bersihkanAngka(f.biasa) || "0", harga_packing_kayu: bersihkanAngka(f.kayu) || "0",
            },
          },
          { onSuccess: onSelesai },
        );
      }}
    >
      <p className="text-sm text-stone-600">
        {produk.sku} · {produk.nama} {produk.ukuran}. Semua harga per unit; cat/jasa mengikuti ukuran barang. Biaya proses pesanan flat (diatur di Profil).
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Harga barang (Rp)">
          <Input inputMode="numeric" required {...bind("harga")} />
        </Field>
        <Field label="Cat dan jasa (Rp)" hint="0 untuk produk non kayu">
          <Input inputMode="numeric" {...bind("cat")} />
        </Field>
        <Field label="Packing biasa (Rp)">
          <Input inputMode="numeric" {...bind("biasa")} />
        </Field>
        <Field label="Packing kayu (Rp)">
          <Input inputMode="numeric" {...bind("kayu")} />
        </Field>
      </div>
      <ErrorBox error={aksi.error} />
      <Button type="submit" disabled={aksi.isPending} className="w-full">
        Simpan
      </Button>
    </form>
  );
}

export default function MasterHargaGrosir() {
  const pelangganQ = usePelanggan();
  const produkQ = useProduk();
  const [pilih, setPilih] = useState("");
  const [edit, setEdit] = useState<Produk | null>(null);
  const pelangganId = pilih || pelangganQ.data?.[0]?.id || "";
  const hargaQ = useQuery({
    queryKey: ["harga-grosir", pelangganId],
    queryFn: () => api<HargaGrosir[]>(`/harga-grosir${query({ pelanggan_id: pelangganId })}`),
    enabled: !!pelangganId,
  });
  const harga = new Map((hargaQ.data ?? []).map((h) => [h.produk_id, h]));

  return (
    <Card judul="Harga grosir per penjual">
      <div className="mb-3 max-w-xs">
        <Field label="Penjual">
          <Select value={pelangganId} onChange={(e) => setPilih(e.target.value)}>
            {(pelangganQ.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorBox error={hargaQ.error} />
      {!pelangganId ? (
        <Kosong teks="Tambahkan penjual lain dulu." />
      ) : (
        <Tabel minLebar={820}>
          <thead>
            <tr>
              <Th lengket>Produk</Th>
              <Th>Ukuran</Th>
              <Th kanan>Barang</Th>
              <Th kanan>Cat + jasa</Th>
              <Th kanan>Packing biasa</Th>
              <Th kanan>Packing kayu</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {(produkQ.data ?? []).map((p) => {
              const h = harga.get(p.id);
              return (
                <tr key={p.id}>
                  <Td lengket>{p.sku} · {p.nama}</Td>
                  <Td>{p.ukuran || "—"}</Td>
                  <Td kanan>{h ? rp(h.harga) : "—"}</Td>
                  <Td kanan>{h ? rp(h.harga_cat_jasa) : "—"}</Td>
                  <Td kanan>{h ? rp(h.harga_packing_biasa) : "—"}</Td>
                  <Td kanan>{h ? rp(h.harga_packing_kayu) : "—"}</Td>
                  <Td>
                    <button className="text-xs font-semibold text-hijau hover:underline" onClick={() => setEdit(p)}>
                      {h ? "Ubah" : "Isi harga"}
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tabel>
      )}
      {edit && (
        <Dialog judul="Harga grosir" onTutup={() => setEdit(null)}>
          <Form produk={edit} pelangganId={pelangganId} awal={harga.get(edit.id)} onSelesai={() => setEdit(null)} />
        </Dialog>
      )}
    </Card>
  );
}
