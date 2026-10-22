import type { Browser, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { FAKE_DISCORD_PORT } from "./fake-discord";
import type { SentMessage } from "./fake-discord";
import { ADMIN, BOT_BLACKLISTED, RECRUITER, stateFile, WHITELISTED } from "./users";

// Retrait de whitelist, puis blacklist et levée, sur un joueur déjà whitelist.
test.describe.configure({ mode: "serial" });

async function as(browser: Browser, user: { username: string }): Promise<Page> {
  const context = await browser.newContext({ storageState: stateFile(user) });
  return context.newPage();
}

async function fakeDiscord<T>(path: string): Promise<T> {
  return (await (await fetch(`http://localhost:${FAKE_DISCORD_PORT}${path}`)).json()) as T;
}

async function openFile(page: Page) {
  await page.goto(`/equipe/joueurs/${WHITELISTED.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(WHITELISTED.username);
}

test("un recruteur ne voit ni le retrait de whitelist ni la blacklist", async ({ browser }) => {
  const page = await as(browser, RECRUITER);
  await openFile(page);
  await expect(page.getByRole("button", { name: /Retirer la whitelist/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Blacklister/ })).toHaveCount(0);
});

test("un admin retire la whitelist : le joueur peut recandidater tout de suite", async ({ browser }) => {
  const admin = await as(browser, ADMIN);
  await openFile(admin);
  await admin.getByRole("button", { name: "Retirer la whitelist…" }).click();
  await admin.getByRole("textbox", { name: /Raison/ }).fill("Absent depuis trois mois");
  await admin.getByRole("button", { name: "Retirer la whitelist", exact: true }).click();
  await expect(admin.getByText("C'est fait.")).toBeVisible();
  await admin.reload();
  await expect(admin.getByText(/Whitelist retirée le/)).toBeVisible();

  const messages = await fakeDiscord<SentMessage[]>("/__messages");
  expect(JSON.stringify(messages.filter(message => message.userId === WHITELISTED.id).at(-1))).toContain("Absent depuis trois mois");

  const player = await as(browser, WHITELISTED);
  await player.goto("/portail");
  await expect(player.getByText("L'équipe t'a retiré ta whitelist.", { exact: false })).toBeVisible();
  await expect(player.getByRole("button", { name: "Commencer ma candidature" })).toBeVisible();
});

test("un admin blackliste le joueur : banni du Discord, bloqué sur le portail", async ({ browser }) => {
  const admin = await as(browser, ADMIN);
  await openFile(admin);
  await admin.getByRole("button", { name: "Blacklister…" }).click();
  await admin.getByRole("textbox", { name: /Raison/ }).fill("Comportement toxique");
  const confirm = admin.getByRole("button", { name: "Blacklister", exact: true });
  await expect(confirm).toBeDisabled();
  await admin.getByRole("textbox", { name: /Recopie BLACKLIST/ }).fill("blacklist");
  await confirm.click();
  await expect(admin.getByText("C'est fait.")).toBeVisible();
  expect(await fakeDiscord<string[]>("/__bans")).toContain(WHITELISTED.id);

  const player = await as(browser, WHITELISTED);
  for (const path of ["/portail", "/portail/candidature", "/liaison"]) {
    await player.goto(path);
    await expect(player).toHaveURL(/\/blacklist$/);
  }
  await expect(player.getByText("Tu es blacklist de Néa Hélikè.")).toBeVisible();
  await expect(player.getByText("Comportement toxique")).toBeVisible();
});

test("un admin lève la blacklist : le bannissement Discord est levé", async ({ browser }) => {
  const admin = await as(browser, ADMIN);
  await openFile(admin);
  await expect(admin.getByText(/Blacklisté le/)).toBeVisible();
  await admin.getByRole("button", { name: "Lever la blacklist…" }).click();
  await admin.getByRole("button", { name: "Lever la blacklist", exact: true }).click();
  await expect(admin.getByText("C'est fait.")).toBeVisible();
  expect(await fakeDiscord<string[]>("/__bans")).not.toContain(WHITELISTED.id);

  const player = await as(browser, WHITELISTED);
  await player.goto("/portail");
  await expect(player).not.toHaveURL(/\/blacklist$/);
});

test("quelqu'un blacklisté par le bot est bloqué dès sa connexion au site", async ({ browser }) => {
  const player = await as(browser, BOT_BLACKLISTED);
  await player.goto("/portail");
  await expect(player).toHaveURL(/\/blacklist$/);
  await expect(player.getByText("Triche en jeu (test)")).toBeVisible();

  const admin = await as(browser, ADMIN);
  await admin.goto("/equipe?onglet=blacklist");
  await expect(admin.getByRole("link", { name: /e2e-blacklist-bot/ })).toBeVisible();
});
