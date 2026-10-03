import { Checkbox, Col, Form, Row } from "antd";
import { useMemo } from "react";
import { AksiForm, Button, Field, Formulir, Input, InputTanggal, Select, Teks } from "./ui";
import { useAksi, usePelanggan, usePemasok, useProduk, useSaluran } from "../lib/data";
import { useFields } from "../lib/form";
import { bersihkanAngka, hariIni } from "../lib/format";
import type { Order } from "../lib/types";

/** Form order baru. Harga dikosongkan = otomatis (harga grosir penjual lain atau harga katalog). */
export default function FormOrder({ onSelesai }: { onSelesai: () => void }) {
  const produkQ = useProduk();
  const pemasokQ = usePemasok();
  const saluranQ = useSaluran();
  const pelangganQ = usePelanggan();
  const aksi = useAksi<Order>();
  const { f, bind, bindNilai } = useFields({
    saluran_id: "", pelanggan_id: "", produk_id: "", pemasok_id: "", no_order: "", nama_pembeli: "", tanggal_order: hariIni(),
    qty: "1", warna: "", jenis_packing: "biasa", polos: "", biaya_pokok: "", harga_satuan: "", potongan_marketplace: "", catatan: "",
  });

  const saluran = saluranQ.data ?? [];
  const produk = produkQ.data ?? [];
  const saluranPilih = saluran.find((s) => s.id === (f.saluran_id || saluran[0]?.id));
  const produkPilih = produk.find((p) => p.id === (f.produk_id || produk[0]?.id));
  const reseller = saluranPilih?.jenis === "reseller";
  const pemasokCocok = useMemo(
    () => (pemasokQ.data ?? []).filter((p) => p.jenis === (produkPilih?.jenis_produk === "non_kayu" ? "supplier" : "tukang_kayu")),
    [pemasokQ.data, produkPilih],
  );

  function kirim() {
    if (!saluranPilih || !produkPilih) return;
    const opsi = (v: string) => (v === "" ? undefined : bersihkanAngka(v));
    aksi.mutate(
      {
        path: "/order",
        body: {
          saluran_id: saluranPilih.id,
          pelanggan_id: reseller ? f.pelanggan_id || undefined : undefined,
          produk_id: produkPilih.id,
          pemasok_id: f.pemasok_id || undefined,
          no_order: f.no_order.trim(),
          nama_pembeli: f.nama_pembeli.trim(),
          tanggal_order: f.tanggal_order,
          qty: Number(f.qty) || 1,
          warna: f.warna.trim(),
          jenis_packing: f.jenis_packing,
          butuh_cat: produkPilih.jenis_produk === "kayu" ? f.polos !== "ya" : undefined,
          biaya_pokok: opsi(f.biaya_pokok),
          harga_satuan: opsi(f.harga_satuan),
          potongan_marketplace: opsi(f.potongan_marketplace) ?? "0",
          catatan: f.catatan.trim(),
        },
      },
      { onSuccess: onSelesai },
    );
  }

  return (
    <Formulir onKirim={kirim}>
      <Row gutter={16}>
<Col xs={24} md={12}>
        <Field label="Saluran">
          <Select value={saluranPilih?.id ?? ""} onChange={bind("saluran_id").onChange}>
            {saluran.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </Select>
        </Field>
</Col>
        {reseller ? (
<Col xs={24} md={12}>
          <Field label="Penjual lain">
            <Select required {...bind("pelanggan_id")}>
              <option value="">Pilih…</option>
              {(pelangganQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </Field>
</Col>
        ) : (
<Col xs={24} md={12}>
          <Field label="Nama pembeli">
            <Input {...bind("nama_pembeli")} />
          </Field>
</Col>
        )}
<Col xs={24} md={12}>
        <Field label="Produk">
          <Select value={produkPilih?.id ?? ""} onChange={bind("produk_id").onChange}>
            {produk.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.nama} {p.ukuran}
              </option>
            ))}
          </Select>
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label={produkPilih?.jenis_produk === "non_kayu" ? "Supplier" : "Tukang kayu"}>
          <Select {...bind("pemasok_id")}>
            <option value="">Belum dipilih</option>
            {pemasokCocok.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </Select>
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Kode pesanan (no. order marketplace)">
          <Input {...bind("no_order")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Tanggal order">
          <InputTanggal {...bindNilai("tanggal_order")} />
        </Field>
</Col>
        {produkPilih?.jenis_produk === "kayu" && (
          <>
<Col xs={24} md={12}>
            <Field label="Warna cat" hint="Warna tidak memengaruhi harga">
              <Input {...bind("warna")} placeholder="mis. hijau sage (custom)" />
            </Field>
</Col>
<Col xs={24} md={12}>
            <Field label="Packing">
              <Select {...bind("jenis_packing")}>
                <option value="biasa">Biasa</option>
                <option value="kayu">Packing kayu</option>
              </Select>
            </Field>
</Col>
<Col xs={24} md={12}>
            <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label=" " colon={false}>
              <Checkbox checked={f.polos === "ya"} onChange={(e) => bind("polos").onChange({ target: { value: e.target.checked ? "ya" : "" } } as never)}>
                Polos (tanpa cat)
              </Checkbox>
            </Form.Item>
</Col>
          </>
        )}
<Col xs={24} md={12}>
        <Field label="Jumlah" hint="Biasanya 1 order = 1 baris">
          <Input inputMode="numeric" {...bind("qty")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Biaya ke pemasok (Rp)" hint="Kosong = biaya katalog">
          <Input inputMode="numeric" {...bind("biaya_pokok")} />
        </Field>
</Col>
<Col xs={24} md={12}>
        <Field label="Harga barang per unit (Rp)" hint="Kosong = otomatis">
          <Input inputMode="numeric" {...bind("harga_satuan")} />
        </Field>
</Col>
        {!reseller && (
<Col xs={24} md={12}>
          <Field label="Potongan marketplace (Rp)">
            <Input inputMode="numeric" {...bind("potongan_marketplace")} />
          </Field>
</Col>
        )}
      </Row>
      <Field label="Catatan">
        <Teks {...bind("catatan")} />
      </Field>
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending || !saluranPilih || !produkPilih}>
          {aksi.isPending ? "Menyimpan…" : "Simpan order"}
        </Button>
      </AksiForm>
    </Formulir>
  );
}
