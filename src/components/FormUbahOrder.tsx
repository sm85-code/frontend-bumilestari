import { Alert, Checkbox, Col, Form, Row } from "antd";
import IsianKolomTambahan from "./IsianKolomTambahan";
import { useMemo, useState } from "react";
import { AksiForm, Button, Field, Formulir, Input, Select, Teks } from "./ui";
import { useAksi, usePemasok } from "../lib/data";
import { useFields } from "../lib/form";
import { bersihkanAngka, num } from "../lib/format";
import type { Order, Produk, NilaiKolom } from "../lib/types";

const angka = (v: string) => String(Math.round(num(v)));

/**
 * Ubah order yang belum selesai: pilih/ganti tukang atau supplier, warna, polos, packing, harga, catatan.
 * Hanya kolom yang berubah yang dikirim (harga otomatis tidak tertimpa bila tidak disentuh).
 */
export default function FormUbahOrder({ order, produk, onSelesai }: { order: Order; produk?: Produk; onSelesai: () => void }) {
  const [kt, setKt] = useState<Record<string, NilaiKolom>>(order.kolom_tambahan ?? {});
  const pemasokQ = usePemasok();
  const aksi = useAksi<Order>();
  const kayu = produk?.jenis_produk !== "non_kayu";
  // Sudah masuk pembayaran (tukang/penjual lain): backend menolak perubahan selain nama pembeli, warna, catatan.
  const kunci = Boolean(order.terkunci);
  const awal = useMemo(
    () => ({
      pemasok_id: order.pemasok_id ?? "",
      nama_pembeli: order.nama_pembeli,
      warna: order.warna,
      polos: order.butuh_cat ? "" : "ya",
      jenis_packing: order.jenis_packing,
      biaya_pokok: angka(order.biaya_pokok),
      harga_satuan: angka(order.harga_satuan),
      potongan_marketplace: angka(order.potongan_marketplace),
      catatan: order.catatan,
    }),
    [order],
  );
  const { f, bind } = useFields(awal);
  const pemasokCocok = (pemasokQ.data ?? []).filter((p) => p.aktif && p.jenis === (kayu ? "tukang_kayu" : "supplier"));

  function kirim() {
    const body: Record<string, unknown> = {};
    if (f.pemasok_id !== awal.pemasok_id) body.pemasok_id = f.pemasok_id || null;
    if (f.nama_pembeli.trim() !== awal.nama_pembeli) body.nama_pembeli = f.nama_pembeli.trim();
    if (f.warna.trim() !== awal.warna) body.warna = f.warna.trim();
    if (kayu && f.polos !== awal.polos) body.butuh_cat = f.polos !== "ya";
    if (kayu && f.jenis_packing !== awal.jenis_packing) body.jenis_packing = f.jenis_packing;
    const uang = (k: "biaya_pokok" | "harga_satuan" | "potongan_marketplace") => {
      if (bersihkanAngka(f[k]) !== bersihkanAngka(awal[k])) body[k] = bersihkanAngka(f[k]) || "0";
    };
    uang("biaya_pokok");
    uang("harga_satuan");
    uang("potongan_marketplace");
    if (f.catatan.trim() !== awal.catatan) body.catatan = f.catatan.trim();
    if (JSON.stringify(kt) !== JSON.stringify(order.kolom_tambahan ?? {})) body.kolom_tambahan = kt;
    if (Object.keys(body).length === 0) return onSelesai();
    aksi.mutate({ path: `/order/${order.id}`, method: "PATCH", body }, { onSuccess: onSelesai });
  }

  return (
    <Formulir onKirim={kirim}>
      {kunci && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title="Order ini sudah masuk pembayaran. Hanya nama pembeli, warna, dan catatan yang bisa diubah; batalkan pembayarannya dulu untuk mengubah harga."
        />
      )}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Field label={kayu ? "Tukang kayu" : "Supplier"} hint="Pilih sesuai siapa yang sedang bisa mengerjakan">
            <Select {...bind("pemasok_id")} disabled={kunci}>
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
          <Field label="Nama pembeli">
            <Input {...bind("nama_pembeli")} />
          </Field>
        </Col>
        {kayu && (
          <>
            <Col xs={24} md={12}>
              <Field label="Warna cat" hint="Warna tidak memengaruhi harga">
                <Input {...bind("warna")} />
              </Field>
            </Col>
            <Col xs={24} md={12}>
              <Field label="Packing">
                <Select {...bind("jenis_packing")} disabled={kunci}>
                  <option value="biasa">Biasa</option>
                  <option value="kayu">Packing kayu</option>
                </Select>
              </Field>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                <Checkbox
                  checked={f.polos === "ya"}
                  disabled={kunci || order.status === "dicat" || order.status === "dikirim"}
                  onChange={(e) => bind("polos").onChange({ target: { value: e.target.checked ? "ya" : "" } } as never)}
                >
                  Polos (tanpa cat)
                </Checkbox>
              </Form.Item>
            </Col>
          </>
        )}
        <Col xs={24} md={12}>
          <Field label="Biaya ke tukang & supplier (Rp)">
            <Input inputMode="numeric" {...bind("biaya_pokok")} disabled={kunci} />
          </Field>
        </Col>
        <Col xs={24} md={12}>
          <Field label="Harga barang per unit (Rp)">
            <Input inputMode="numeric" {...bind("harga_satuan")} disabled={kunci} />
          </Field>
        </Col>
        <Col xs={24} md={12}>
          <Field label="Potongan marketplace (Rp)">
            <Input inputMode="numeric" {...bind("potongan_marketplace")} disabled={kunci} />
          </Field>
        </Col>
      </Row>
      <Field label="Catatan">
        <Teks {...bind("catatan")} />
      </Field>
      <IsianKolomTambahan entitas="order" nilai={kt} onUbah={setKt} />
      <AksiForm error={aksi.error}>
        <Button type="submit" disabled={aksi.isPending}>
          {aksi.isPending ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </AksiForm>
    </Formulir>
  );
}
