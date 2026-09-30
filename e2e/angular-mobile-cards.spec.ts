import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's mobile-cards page: every row a labelled card,
 * and a load-more button in place of the pager.
 */

const PAGE = "/unstyled/mobile-cards/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

test("draws every row as a card with its column labels", async ({ page }) => {
  await page.goto(PAGE);
  await expect(part(page, "table")).toHaveCount(0);
  await expect(part(page, "card")).toHaveCount(8);
  const rows = part(page, "card")
    .first()
    .locator('[data-adapttable-part="card-row"]');
  await expect(rows.first()).toHaveText("Ada Lovelace");
  await expect(rows.nth(1)).toHaveText(/Team\s*Core/);
});

test("loads the next rows as the list reaches its end", async ({ page }) => {
  await page.goto(PAGE);
  await expect(part(page, "pager")).toHaveCount(0);
  await expect(part(page, "card")).toHaveCount(8);
  await part(page, "card").last().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 2000);
  await expect.poll(() => part(page, "card").count()).toBeGreaterThan(8);
});
