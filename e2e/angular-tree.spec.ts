import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's tree page: the seed's org chart, each team lead
 * over their team, on desktop and on phone cards.
 */

const PAGE = "/unstyled/tree/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

const row = (page: Page, id: string) =>
  page.locator(`.mx-demo [data-adapttable-part="row"][data-row-id="${id}"]`);

/** Each rendered row's id and whether its tree cell is indented. */
const outline = (page: Page) =>
  part(page, "row").evaluateAll((rows) =>
    rows.map((element) => {
      const cell = element.querySelector<HTMLElement>(
        '[data-adapttable-part="tree-cell"]'
      );
      return {
        id: element.getAttribute("data-row-id"),
        nested: (cell?.style.paddingInlineStart ?? "") !== "",
      };
    })
  );

test("starts with the leads folded and opens a branch in place", async ({
  page,
}) => {
  await page.goto(PAGE);
  const leads = await outline(page);
  expect(leads.length).toBeGreaterThan(1);
  expect(leads.every((entry) => !entry.nested)).toBe(true);

  const first = leads[0]!.id!;
  const toggle = row(page, first).locator(
    '[data-adapttable-part="tree-toggle"]'
  );
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-label", "Expand row");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const opened = await outline(page);
  expect(opened.length).toBeGreaterThan(leads.length);
  expect(opened[0]!.id).toBe(first);
  expect(opened[1]!.nested).toBe(true);
  // Children sit between their lead and the next lead.
  const nextLead = opened.findIndex(
    (entry, index) => index > 0 && !entry.nested
  );
  expect(opened[nextLead]!.id).toBe(leads[1]!.id);

  await toggle.click();
  await expect(part(page, "row")).toHaveCount(leads.length);
});

test("keeps children under their lead when the table sorts", async ({
  page,
}) => {
  await page.goto(PAGE);
  const lead = (await outline(page))[0]!.id!;
  await row(page, lead).locator('[data-adapttable-part="tree-toggle"]').click();
  const before = await outline(page);
  const children = before.filter((entry) => entry.nested).map((e) => e.id);

  await part(page, "sort-button").first().click();
  await part(page, "sort-button").first().click();
  const after = await outline(page);
  const at = after.findIndex((entry) => entry.id === lead);
  const block = after.slice(at + 1, at + 1 + children.length);
  expect(block.every((entry) => entry.nested)).toBe(true);
  expect(new Set(block.map((entry) => entry.id))).toEqual(new Set(children));
});

test("shows the rows a search matches", async ({ page }) => {
  await page.goto(PAGE);
  const lead = (await outline(page))[0]!.id!;
  await row(page, lead).locator('[data-adapttable-part="tree-toggle"]').click();
  const child = (await outline(page))[1]!.id!;
  const name = (
    await row(page, child)
      .locator('[data-adapttable-part="cell"]')
      .first()
      .innerText()
  ).trim();
  const shown = (await outline(page)).length;
  await part(page, "search").fill(name);
  await expect
    .poll(async () => (await outline(page)).length)
    .toBeLessThan(shown);
  expect((await outline(page)).map((entry) => entry.id)).toEqual([child]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("leads each card with the chevron and indents a child card", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const card = page.locator('.mx-demo [data-adapttable-part="card"]').first();
    const id = await card.getAttribute("data-row-id");
    await card.locator('[data-adapttable-part="tree-toggle"]').click();
    const next = page.locator('.mx-demo [data-adapttable-part="card"]').nth(1);
    await expect(next).not.toHaveAttribute("data-row-id", id!);
    expect(
      await next.evaluate((element) => element.style.marginInlineStart)
    ).toBe("1.25rem");
  });
});
