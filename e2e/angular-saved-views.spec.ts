import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's saved-views page: save the table's state under
 * a name, change it, and put it back from the menu.
 */

const PAGE = "/unstyled/saved-views/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

const firstPerson = (page: Page) =>
  part(page, "row").first().locator('[data-adapttable-part="cell"]').first();

test("saves a sorted view by name and restores it from the menu", async ({
  page,
}) => {
  await page.goto(PAGE);
  await page.evaluate(() =>
    localStorage.removeItem("adapttable-angular-demo-views")
  );
  await page.reload();

  const sort = part(page, "sort-button").first();
  await sort.click();
  await sort.click();
  await expect(firstPerson(page)).toHaveText("Yann LeCun");

  await part(page, "views-button").click();
  await part(page, "views-input").fill("Z to A");
  await part(page, "views-save").click();
  await expect(part(page, "views-item")).toHaveText(["Z to A"]);

  await sort.click();
  await expect(firstPerson(page)).toHaveText("Ada Lovelace");

  if ((await part(page, "views-panel").count()) === 0) {
    await part(page, "views-button").click();
  }
  await part(page, "views-item").filter({ hasText: "Z to A" }).click();
  await expect(firstPerson(page)).toHaveText("Yann LeCun");
});
