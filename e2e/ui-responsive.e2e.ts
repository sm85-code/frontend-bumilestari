import { expect, test } from "@playwright/test";
import { pasangApiTiruan } from "./mock-api";

test("navigasi ringkas dan tabel terbaca pada HP portrait, landscape, dan desktop", async ({ page }) => {
  await pasangApiTiruan(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/order");
    const menu = page.getByRole("button", { name: "Menu", exact: true });
    const navigation = page.getByRole("navigation", { name: "Navigasi utama" });
    if (viewport.width < 1024) {
      await expect(navigation).toBeHidden();
      await menu.click();
      await expect(navigation).toBeVisible();
      await page.getByRole("link", { name: "Produksi", exact: true }).click();
      await expect(navigation).toBeHidden();
      await page.goto("/order");
    } else {
      await expect(menu).toBeHidden();
      await expect(navigation).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Order", exact: true })).toBeVisible();
    const table = page.locator(".keu-table").first();
    await expect(table).toBeVisible();
    expect(await table.locator("th").first().evaluate(element => ({ background: getComputedStyle(element.closest("thead")!).backgroundColor, padding: parseFloat(getComputedStyle(element).paddingLeft) }))).toEqual({ background: "rgb(234, 242, 229)", padding: 20 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.getByRole("button", { name: "Input pesanan manual", exact: true }).evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
});
