import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { FAKE_DISCORD_PORT } from "./fake-discord";
import type { SentMessage } from "./fake-discord";
import { ADMIN, RECRUITER, REFUSED, stateFile, WIPER } from "./users";

// Candidature refusée (délai, réouverture), dossier de reprise déposé à part, wipe de personnage.
test.describe.configure({ mode: "serial" });

async function as(browser: Browser, user: { username: string }): Promise<Page> {
  const context = await browser.newContext({ storageState: stateFile(user) });
  return context.newPage();
}

async function messagesTo(userId: string) {
  const messages = (await (await fetch(`http://localhost:${FAKE_DISCORD_PORT}/__messages`)).json()) as SentMessage[];
  return messages.filter(message => message.userId === userId).map(message => JSON.stringify(message));
}

test("un admin lève le délai d'un refus, puis rouvre la candidature", async ({ browser }) => {
  const admin = await as(browser, ADMIN);
  await admin.goto(`/equipe/joueurs/${REFUSED.id}`);
  await admin.getByRole("button", { name: "Lever le délai de 3 mois" }).click();
  await admin.getByRole("button", { name: "Lever le délai", exact: true }).click();
  await expect(admin.getByText("Décision enregistrée.")).toBeVisible();

  const player = await as(browser, REFUSED);
  await player.goto("/portail");
  await expect(player.getByText("l'équipe a levé le délai")).toBeVisible();
  await expect(player.getByRole("button", { name: "Commencer ma candidature" })).toBeVisible();

  await admin.reload();
  await expect(admin.getByText("Délai levé : le joueur peut recandidater.")).toBeVisible();
  await expect(admin.getByRole("button", { name: "Lever le délai de 3 mois" })).toHaveCount(0);
  await admin.getByRole("button", { name: "Rouvrir la candidature" }).first().click();
  await admin.getByRole("button", { name: "Rouvrir la candidature" }).click();
  await expect(admin.getByText("Décision enregistrée.")).toBeVisible();
  await admin.reload();
  await expect(admin.getByRole("button", { name: "Valider la candidature" })).toBeVisible();
  expect((await messagesTo(REFUSED.id)).some(message => message.includes("Candidature rouverte"))).toBe(true);
});

test("un joueur whitelist dépose un dossier de reprise à part, l'équipe l'accepte", async ({ browser }) => {
  const player = await as(browser, WIPER);
  await player.goto("/portail/dossier");
  await player.getByRole("link", { name: "Déposer un dossier de reprise" }).click();
  await expect(player).toHaveURL(/\/portail\/dossier\/deposer$/);
  await player.getByText("Une entreprise", { exact: true }).click();
  await player.getByText("Une nouvelle entreprise", { exact: true }).click();
  await player.getByRole("textbox", { name: "Nom de la nouvelle entreprise" }).fill("La forge du port");
  await player.getByRole("textbox", { name: "Lien vers ton dossier" }).fill("https://docs.google.com/document/d/e2e-dossier");
  await player.getByText("Mon document est partagé en lecture").click();
  await player.getByRole("button", { name: "Envoyer le dossier" }).click();
  await expect(player).toHaveURL(/envoye=1/);
  await expect(player.getByText("Nouvelle entreprise : La forge du port").first()).toBeVisible();

  const recruiter = await as(browser, RECRUITER);
  await recruiter.goto("/equipe/dossiers");
  const card = recruiter.getByRole("article").filter({ hasText: WIPER.username });
  await expect(card).toContainText("Nouvelle entreprise : La forge du port");
  // Refuser sans message : refusé.
  await card.getByRole("button", { name: "Refuser" }).click();
  await expect(card.getByText("Explique au joueur pourquoi son dossier est refusé.")).toBeVisible();
  await card.getByRole("button", { name: "Accepter le dossier" }).click();
  await expect(recruiter.getByText("Décision enregistrée.")).toBeVisible();

  await player.goto("/portail/dossier");
  await expect(player.getByText("Dossier accepté")).toBeVisible();
});

test("un admin invite au wipe, le joueur refait son personnage, l'admin le valide", async ({ browser }) => {
  const admin = await as(browser, ADMIN);
  await admin.goto("/equipe/wipes");
  await admin.getByLabel("Joueur whitelist").selectOption(WIPER.id);
  await admin.getByRole("button", { name: "Inviter à refaire son personnage" }).click();
  await expect(admin.getByText("Invitation envoyée")).toBeVisible();

  const player = await as(browser, WIPER);
  await player.goto("/portail");
  await player.getByRole("link", { name: "Refaire mon personnage" }).click();
  await player.getByRole("link", { name: /Nouveau personnage/ }).click();
  await expect(player).toHaveURL(/\/portail\/wipe\/rp$/);
  await player.getByRole("textbox", { name: "Prénom", exact: true }).fill("Nouvelle");
  await player.getByRole("textbox", { name: "Nom", exact: true }).fill("Héroïne");
  await player.getByRole("textbox", { name: "Âge du personnage", exact: true }).fill("26");
  await player.getByText("Aucune affinité").click();
  await player.getByText("Humain", { exact: true }).click();
  await player.getByRole("button", { name: "Suivant" }).click();
  await expect(player).toHaveURL(/\/portail\/wipe\/background$/);
  // Pas de partie HRP dans un wipe.
  await expect(player.getByRole("textbox", { name: "Heures de RP" })).toHaveCount(0);
  await player.getByRole("textbox", { name: "Lien vers ton background" }).fill("https://docs.google.com/document/d/e2e-nouveau");
  await player.getByText("Mon document est partagé en lecture").click();
  await player.getByRole("button", { name: "Suivant" }).click();
  await expect(player).toHaveURL(/\/portail\/wipe$/);
  await player.getByRole("button", { name: "Envoyer ma demande de wipe" }).click();
  await expect(player).toHaveURL(/envoyee=1/);

  // La demande n'apparaît pas sur la fiche du joueur.
  await admin.goto(`/equipe/joueurs/${WIPER.id}`);
  await expect(admin.locator("#contenu").getByText(/demande de wipe|refaire son personnage|nouveau personnage/i)).toHaveCount(0);
  await expect(admin.getByText("Aucun wipe", { exact: true })).toBeVisible();

  await admin.goto("/equipe/wipes");
  const request = admin.getByRole("region", { name: `Wipe de ${WIPER.username}` });
  await expect(request).toContainText("Ancien Personnage");
  await expect(request).toContainText("Nouvelle Héroïne");
  await request.getByRole("button", { name: "Valider le wipe" }).click();
  await expect(admin.getByText("Décision enregistrée.")).toBeVisible();

  await admin.goto(`/equipe/joueurs/${WIPER.id}`);
  await expect(admin.getByText("Nouvelle Héroïne").first()).toBeVisible();
  // Seulement le nombre de wipes validés, visible de toute l'équipe sur la fiche.
  await expect(admin.getByText("1 wipe", { exact: true })).toBeVisible();
  const recruiter = await as(browser, RECRUITER);
  await recruiter.goto(`/equipe/joueurs/${WIPER.id}`);
  await expect(recruiter.getByText("1 wipe", { exact: true })).toBeVisible();
  expect((await messagesTo(WIPER.id)).some(message => message.includes("Wipe accepté"))).toBe(true);
});
