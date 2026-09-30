import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's nested-tables page: each person's orders in a
 * real table under their row, with its own columns and keys.
 */

const PAGE = "/unstyled/nested-tables/";

const demo = (page: Page) => page.locator(".mx-demo");
const part = (page: Page, name: string) =>
  demo(page).locator(`[data-adapttable-part="${name}"]`);
const row = (page: Page, id: string) =>
  demo(page).locator(`[data-adapttable-part="row"][data-row-id="${id}"]`);

test("opens with the first person's orders nested in a named region", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(part(page, "expand-header")).toHaveAttribute(
    "aria-label",
    "Expand row"
  );
  const toggle = row(page, "1").locator(
    '[data-adapttable-part="expand-button"]'
  );
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const region = part(page, "nested-table");
  await expect(region).toHaveCount(1);
  const name = await region.getAttribute("aria-label");
  expect(name).toMatch(/^Orders for /);
  const inner = region.locator('[data-adapttable-part="table"]');
  await expect(inner).toHaveAttribute("aria-label", name!);
  await expect(
    inner.locator('[data-adapttable-part="header-cell"]')
  ).toHaveText([/Item/, /Qty/, /Amount/]);
  await expect(
    inner.locator('[data-adapttable-part="row"]').first()
  ).toHaveAttribute("data-row-id", "1-1");
  // The nested table has no search box of its own.
  await expect(region.locator('[data-adapttable-part="search"]')).toHaveCount(
    0
  );
});

test("closes and opens rows independently, and never writes the URL", async ({
  page,
}) => {
  await page.goto(PAGE);
  const url = page.url();
  const first = row(page, "1").locator(
    '[data-adapttable-part="expand-button"]'
  );
  const second = row(page, "2").locator(
    '[data-adapttable-part="expand-button"]'
  );
  await second.click();
  await expect(part(page, "nested-table")).toHaveCount(2);
  await first.click();
  await expect(part(page, "nested-table")).toHaveCount(1);
  await expect(first).toHaveAttribute("aria-expanded", "false");

  expect(page.url()).toBe(url);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens a card's orders inside the card", async ({ page }) => {
    await page.goto(PAGE);
    const card = demo(page)
      .locator('[data-adapttable-part="card"][data-row-id="2"]')
      .first();
    await card
      .locator('[data-adapttable-part="expand-button"]')
      .first()
      .click();
    await expect(
      card.locator(
        '[data-adapttable-part="card-detail"] [data-adapttable-part="nested-table"]'
      )
    ).toHaveCount(1);
  });
});
