import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's selection page: a set of ids that survives
 * paging, and bulk actions the host runs over it.
 */

const PAGE = "/unstyled/selection/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

const rowBox = (page: Page, index: number) =>
  part(page, "row").nth(index).getByRole("checkbox");

test("keeps a selection across pages and hands the whole set to a bulk action", async ({
  page,
}) => {
  await page.goto(PAGE);
  await rowBox(page, 0).check();
  await rowBox(page, 2).check();
  await expect(part(page, "bulk-bar")).toContainText("2 selected");

  await part(page, "page-number").nth(1).click();
  await part(page, "selection-header").getByRole("checkbox").check();
  await expect(part(page, "bulk-bar")).toContainText("12 selected");

  await part(page, "page-number").nth(0).click();
  await expect(rowBox(page, 0)).toBeChecked();
  await expect(rowBox(page, 2)).toBeChecked();

  await part(page, "bulk-bar").getByRole("button", { name: "Archive" }).click();
  await expect(page.locator("[data-demo-log]")).toHaveText(
    "Archive: 1, 3, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20"
  );
});

test("offers every matching row once the page is selected", async ({
  page,
}) => {
  await page.goto(PAGE);
  await part(page, "selection-header").getByRole("checkbox").check();
  const banner = part(page, "select-all-banner");
  await expect(banner).toContainText("10 on this page");
  await part(page, "select-all-button").click();
  await expect(part(page, "bulk-bar")).toContainText("30");
});
