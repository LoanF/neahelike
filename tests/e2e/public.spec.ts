import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: /Néa Hélikè/i },
  { path: "/lore", heading: /Lore|histoire/i },
  { path: "/reglement", heading: /Règlement/i },
  { path: "/faq", heading: /FAQ|questions/i },
  { path: "/cgu", heading: /Conditions générales/i },
];

test.describe("site public", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} s'affiche sans déborder sur mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(heading);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("la navigation principale mène au règlement", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Règlement" }).click();
    await expect(page).toHaveURL(/\/reglement$/);
  });

  test("un lien partagé a une image d'aperçu", async ({ page, request }) => {
    await page.goto("/lore");
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(image).toBeTruthy();
    const response = await request.get(new URL(image!).pathname + new URL(image!).search);
    expect(response.headers()["content-type"]).toBe("image/png");
  });

  test("une page inconnue affiche la page 404", async ({ page }) => {
    const response = await page.goto("/cette-page-n-existe-pas");
    expect(response?.status()).toBe(404);
  });

  test("le lien d'évitement est le premier arrêt au clavier", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
  });
});
