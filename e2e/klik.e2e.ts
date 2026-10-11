import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

test("lima menu baru", async ({ page }) => {
  await pasangApiTiruan(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  for (const label of ["Order", "Produksi", "Keuangan", "Pengaturan"]) {
    if (await page.getByRole("button", { name: "Menu", exact: true }).isVisible()) await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("link", { name: label }).first().click();
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
  }
});
