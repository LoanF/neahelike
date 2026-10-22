import { expect, test } from "@playwright/test";
import { PLAYER, stateFile } from "./users";

test.describe("sans être connecté", () => {
  for (const path of ["/portail", "/portail/candidature", "/equipe", "/equipe/roles"]) {
    test(`${path} renvoie vers la connexion`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/connexion$/);
      await expect(page.getByRole("button", { name: /Discord/ })).toBeVisible();
    });
  }
});

test.describe("connecté en joueur", () => {
  test.use({ storageState: stateFile(PLAYER) });

  test("ouvre son tableau de bord", async ({ page }) => {
    await page.goto("/portail");
    await expect(page).toHaveURL(/\/portail$/);
    await expect(page.getByRole("complementary", { name: "Menu du portail" })).toContainText(PLAYER.username);
  });

  test("n'a pas accès à l'espace équipe ni à l'administration", async ({ page }) => {
    for (const path of ["/equipe", "/equipe/statistiques", "/equipe/roles"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/portail$/);
    }
    await expect(page.getByRole("link", { name: "Joueurs" })).toHaveCount(0);
  });
});
