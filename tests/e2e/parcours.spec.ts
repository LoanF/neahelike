import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { FAKE_DISCORD_PORT } from "./fake-discord";
import type { SentMessage } from "./fake-discord";
import { PLAYER, RECRUITER, stateFile } from "./users";

// Un seul parcours, dans l'ordre : le joueur candidate, le recruteur demande une modification,
// le joueur corrige et renvoie, le recruteur valide l'écrit puis l'entretien.
test.describe.configure({ mode: "serial" });

async function as(browser: Browser, user: { username: string }): Promise<Page> {
  const context = await browser.newContext({ storageState: stateFile(user) });
  return context.newPage();
}

async function messagesTo(userId: string): Promise<SentMessage[]> {
  const response = await fetch(`http://localhost:${FAKE_DISCORD_PORT}/__messages`);
  const messages = (await response.json()) as SentMessage[];
  return messages.filter(message => message.userId === userId);
}

async function next(page: Page, url: RegExp) {
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page).toHaveURL(url);
}

async function openPlayerFile(page: Page) {
  await page.goto(`/equipe/joueurs/${PLAYER.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(PLAYER.username);
}

test("le joueur remplit et envoie sa candidature", async ({ browser }) => {
  const page = await as(browser, PLAYER);
  await page.goto("/portail/candidature");
  await page.getByRole("button", { name: "Commencer ma candidature" }).click();
  await expect(page).toHaveURL(/\/candidature\/hrp$/);

  // Une erreur de saisie est signalée sans quitter l'étape.
  await page.getByRole("textbox", { name: "Âge", exact: true }).fill("16");
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByText("L'âge : 18 minimum.")).toBeVisible();

  await page.getByRole("textbox", { name: "Âge", exact: true }).fill("24");
  await page.getByRole("textbox", { name: "Heures de RP", exact: true }).fill("300");
  await page.getByRole("textbox", { name: "Tes expériences RP", exact: true }).fill("Deux ans de RP sur des serveurs whitelist.");
  await page.getByText("J'ai un micro de bonne qualité").click();
  await next(page, /\/candidature\/rp$/);

  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("Eudoxie");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Lykaina");
  await page.getByRole("textbox", { name: "Âge du personnage", exact: true }).fill("30");
  await page.getByRole("textbox", { name: "Origine du personnage", exact: true }).fill("Née dans les falaises au-dessus du port.");
  await page.getByText("Aucune affinité").click();
  await page.getByText("Humain", { exact: true }).click();
  await next(page, /\/candidature\/background$/);

  await page.getByRole("textbox", { name: "Lien vers ton background", exact: true }).fill("https://docs.google.com/document/d/e2e");
  await page.getByText("Mon document est partagé en lecture").click();
  await next(page, /\/candidature\/recapitulatif$/);

  await expect(page.getByText("Eudoxie Lykaina")).toBeVisible();
  const send = page.getByRole("button", { name: "Envoyer ma candidature" });
  await expect(send).toBeDisabled();
  await page.getByText("Je certifie", { exact: false }).click();
  await send.click();
  await expect(page).toHaveURL(/envoyee=1/);
  await expect(page.getByRole("status")).toContainText("Ta candidature est envoyée");
});

test("le recruteur la voit à traiter et demande une modification du background", async ({ browser }) => {
  const page = await as(browser, RECRUITER);
  await page.goto("/equipe");
  await page.getByPlaceholder("ID Discord, pseudo, prénom ou nom RP").fill("Lykaina");
  await expect(page.getByRole("link", { name: /e2e-joueur/ })).toBeVisible();

  await openPlayerFile(page);
  await page.getByRole("button", { name: "Demander une modification" }).click();
  await page.getByText("Background", { exact: true }).last().click();
  await page.getByRole("textbox", { name: "Message au joueur", exact: true }).fill("Le lien du background ne s'ouvre pas, partage-le en lecture.");
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByText("Décision enregistrée.")).toBeVisible();

  const messages = await messagesTo(PLAYER.id);
  expect(JSON.stringify(messages.at(-1))).toContain("partage-le en lecture");
});

test("le joueur ne peut corriger que le background, puis renvoie", async ({ browser }) => {
  const page = await as(browser, PLAYER);
  await page.goto("/portail/candidature");
  await expect(page).toHaveURL(/\/candidature\/background$/);

  await page.goto("/portail/candidature/hrp");
  await expect(page).not.toHaveURL(/\/candidature\/hrp$/);

  await page.goto("/portail/candidature/background");
  await page.getByRole("textbox", { name: "Lien vers ton background", exact: true }).fill("https://docs.google.com/document/d/e2e-corrige");
  await next(page, /\/candidature\/recapitulatif$/);
  await page.getByText("Je certifie", { exact: false }).click();
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page).toHaveURL(/envoyee=1/);
});

test("le recruteur valide l'écrit puis l'entretien vocal", async ({ browser }) => {
  const page = await as(browser, RECRUITER);
  await openPlayerFile(page);
  await expect(page.getByText("e2e-corrige")).toBeVisible();

  await page.getByRole("button", { name: "Valider la candidature" }).click();
  await page.getByRole("button", { name: "Confirmer la validation" }).click();
  await expect(page.getByText("Décision enregistrée.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Valider l'entretien vocal" }).click();
  await page.getByRole("button", { name: "Confirmer la whitelist" }).click();
  await expect(page.getByText("Décision enregistrée.")).toBeVisible();

  expect((await messagesTo(PLAYER.id)).length).toBeGreaterThanOrEqual(3);
});

test("le joueur whitelist ne peut plus recandidater", async ({ browser }) => {
  const page = await as(browser, PLAYER);
  await page.goto("/portail/candidature");
  await expect(page.getByText("Ta whitelist est déjà validée")).toBeVisible();
});
