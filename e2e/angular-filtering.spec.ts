import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's filtering page: the popover's fields and AND/OR
 * tree, chips, the URL, the drawer and header funnels.
 */

const PAGE = "/unstyled/filtering/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

/** The Team column's text in every rendered row. */
const teams = (page: Page) =>
  part(page, "row").evaluateAll((rows) =>
    rows.map(
      (row) =>
        row
          .querySelectorAll('[data-adapttable-part="cell"]')[1]
          ?.textContent?.trim() ?? ""
    )
  );

test("builds each declared filter as a native field in the popover", async ({
  page,
}) => {
  await page.goto(PAGE);
  await part(page, "filters-button").click();
  const popover = part(page, "filters-popover");
  await expect(popover).toBeVisible();
  const labels = popover.locator('[data-adapttable-part="filter-label"]');
  await expect(labels).toHaveText([
    "Person",
    "Team",
    "Status",
    "Budget",
    "Start",
    "Allocation count",
    "Core team",
  ]);
  await expect(popover.getByRole("checkbox", { name: "Core" })).toBeVisible();
  await expect(
    popover.locator('[data-adapttable-part="filter-tree"]')
  ).toHaveCount(1);
});

test("filters rows, shows a chip and writes the URL; the chip removes itself", async ({
  page,
}) => {
  await page.goto(PAGE);
  await part(page, "filters-button").click();
  await part(page, "filters-popover")
    .getByRole("checkbox", { name: "Core" })
    .check();
  await expect(part(page, "row")).toHaveCount(6);
  expect(new Set(await teams(page))).toEqual(new Set(["Core"]));
  await expect(part(page, "chip").first()).toContainText("Team: Core");
  await expect(part(page, "filters-count")).toHaveText("1");
  await expect(page).toHaveURL(/flt\.f_team=Core/);

  await page.keyboard.press("Escape");
  await part(page, "chip-remove").first().click();
  await expect(part(page, "row")).toHaveCount(25);
  await expect(page).not.toHaveURL(/f_team/);
});

test("restores a filtered view from its link", async ({ page }) => {
  await page.goto(`${PAGE}?flt.f_team=Core&flt.atv=1`);
  await expect(part(page, "row")).toHaveCount(6);
  await expect(part(page, "chip").first()).toContainText("Team: Core");
});

test("narrows through the AND/OR tree", async ({ page }) => {
  await page.goto(PAGE);
  await part(page, "filters-button").click();
  const tree = part(page, "filter-tree");
  await tree.locator('[data-adapttable-part="filter-tree-summary"]').click();
  await tree.getByRole("button", { name: "Add condition" }).click();
  const condition = tree.locator(
    '[data-adapttable-part="filter-tree-condition"]'
  );
  await condition.locator("input").fill("Grace");
  await expect(part(page, "row")).toHaveCount(1);
  await expect(part(page, "row").first()).toContainText("Grace Hopper");
  await expect(part(page, "chip").first()).toContainText("Grace");
});

test("opens a drawer that holds focus and closes on Escape", async ({
  page,
}) => {
  await page.goto(PAGE);
  await page.getByRole("button", { name: "Drawer", exact: true }).click();
  await part(page, "filters-button").click();
  const drawer = part(page, "filters-panel");
  await expect(drawer).toBeVisible();
  await expect(part(page, "filters-backdrop")).toBeVisible();
  expect(
    await drawer.evaluate((panel) => panel.contains(document.activeElement))
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
});

test("filters one column from its header funnel", async ({ page }) => {
  await page.goto(PAGE);
  await page.getByRole("button", { name: "Header", exact: true }).click();
  const funnels = part(page, "filter-header-trigger");
  // Person, Team, Status, Timeline, Budget, Load — every column with a filter.
  await expect(funnels).toHaveCount(6);
  await funnels.nth(1).click();
  await page.getByRole("checkbox", { name: "Core" }).check();
  await expect(part(page, "row")).toHaveCount(6);
  expect(new Set(await teams(page))).toEqual(new Set(["Core"]));
});
