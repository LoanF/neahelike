import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { ADMIN, stateFile } from "./users";

test.use({ storageState: stateFile(ADMIN) });

/** Libellés des critères dans l'ordre affiché. */
function criteriaOrder(page: Page) {
  return page.locator("li strong").allTextContents();
}

test("un admin change l'ordre des critères de refus, puis le remet", async ({ page }) => {
  await page.goto("/equipe/criteres");
  const before = await criteriaOrder(page);
  expect(before.length).toBeGreaterThan(1);

  await page.getByRole("button", { name: `Descendre ${before[0]}` }).click();
  await expect.poll(() => criteriaOrder(page)).toEqual([before[1], before[0], ...before.slice(2)]);

  await page.getByRole("button", { name: `Monter ${before[0]}` }).click();
  await expect.poll(() => criteriaOrder(page)).toEqual(before);
});
