import { expect, test } from "@playwright/test";
import { PLAYER, stateFile } from "./users";

test.describe("cloche des notifications", () => {
  test.use({ storageState: stateFile(PLAYER) });

  test("Échap ferme le panneau et rend le focus à la cloche", async ({ page }) => {
    await page.goto("/portail");
    const bell = page.getByRole("button", { name: /Notifications/ });
    await bell.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Notifications" })).toHaveCount(0);
    await expect(bell).toBeFocused();
  });
});

test("Échap ferme le menu mobile du site et rend le focus au bouton", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeFocused();
});
