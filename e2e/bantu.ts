import { expect, type Page } from "@playwright/test";
import type { Panggilan } from "./mock-api";

export const hp = (nama: string) => nama === "hp";
export const urlAkhir = (path: string) => new RegExp(path === "/" ? "/$" : `${path}$`);

export async function tulisanTerkirim(panggilan: Panggilan[], metode: string, path: string) {
  await expect.poll(() => panggilan.find((p) => p.metode === metode && p.path === path)?.body).toBeTruthy();
  return panggilan.find((p) => p.metode === metode && p.path === path)!.body;
}

export async function dialogKonfirmasi(page: Page) {
  const dlg = page.locator(".ant-modal-confirm");
  await expect(dlg).toBeVisible();
  return dlg;
}
