import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's rows page: pin a row from its 3-dot menu, keep
 * it through a reload, and watch it stay put while the rest scroll.
 */

const PAGE = "/unstyled/rows/";

const demo = (page: Page) => page.locator(".mx-demo");
const row = (page: Page, id: string) =>
  demo(page).locator(`tbody tr[data-row-id="${id}"]`);

/** Choose an entry from a row's 3-dot menu. */
async function choose(page: Page, id: string, entry: string) {
  const target = row(page, id);
  await target.locator('[data-adapttable-part="row-actions-trigger"]').click();
  await target.getByRole("button", { name: entry, exact: true }).click();
}

test("pins a row from its menu and keeps it through a reload", async ({
  page,
}) => {
  await page.goto(PAGE);
  await choose(page, "5", "Pin to top");
  const pinned = row(page, "5");
  await expect(pinned).toHaveAttribute("data-adapttable-part", "pinned-top");
  await expect(demo(page).locator("tbody tr").first()).toHaveAttribute(
    "data-row-id",
    "5"
  );
  await expect(page).toHaveURL(/rowPin/);

  await page.reload();
  await expect(row(page, "5")).toHaveAttribute(
    "data-adapttable-part",
    "pinned-top"
  );
});

test("keeps a top pin in view while the rest scroll", async ({ page }) => {
  await page.goto(PAGE);
  await choose(page, "5", "Pin to top");
  const box = demo(page).locator('[data-adapttable-part="scroll-box"]');
  await box.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const boxTop = (await box.boundingBox())!.y;
  await expect
    .poll(async () => Math.round((await row(page, "5").boundingBox())!.y))
    .toBe(Math.round(boxTop));
});

test("pins to the bottom, and unpins", async ({ page }) => {
  await page.goto(PAGE);
  await choose(page, "2", "Pin to bottom");
  await expect(row(page, "2")).toHaveAttribute(
    "data-adapttable-part",
    "pinned-bottom"
  );
  await expect(demo(page).locator("tbody tr").last()).toHaveAttribute(
    "data-row-id",
    "2"
  );
  await choose(page, "2", "Unpin row");
  await expect(row(page, "2")).toHaveAttribute("data-adapttable-part", "row");
});
