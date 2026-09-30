import { expect, type Page, test } from "@playwright/test";

import {
  builtAdapters,
  featuresOf,
  fillTemplate,
  headFor,
  landingHead,
} from "../apps/showcase/matrix.mjs";
import { demoRoute, siteUrl } from "../scripts/site.mjs";

/**
 * Every Angular kit's pages: each boots the Angular entry, mounts the real
 * kit, reads as a page without JavaScript, and links its siblings.
 */

const KITS = builtAdapters("angular");

/** Console errors a page logs while it loads. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("the showcase serves at least one Angular kit", () => {
  expect(KITS.length).toBeGreaterThan(0);
});

for (const kit of KITS) {
  const pages = [
    { dir: kit.key, heading: fillTemplate("AdaptTable for {kit}", kit) },
    ...featuresOf(kit).map((feature) => ({
      dir: `${kit.key}/${feature.slug}`,
      heading: fillTemplate(headFor(feature, kit).h1, kit),
    })),
  ];

  for (const { dir, heading } of pages) {
    test(`${dir}: mounts the kit's table with no errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`/${dir}/`);
      await expect(page.locator("adapt-showcase-matrix-page")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(
        page.locator('.mx-demo [data-adapttable-part="root"]').first()
      ).toBeVisible();
      await expect(page.locator(".mx-seam")).toContainText(kit.pkg);
      expect(errors).toEqual([]);
    });
  }

  test(`${kit.key}: every page stays within the width of a phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const { dir } of pages) {
      await page.goto(`/${dir}/`);
      await expect(page.locator(".mx-seam")).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.scrollingElement!.scrollWidth -
          document.scrollingElement!.clientWidth
      );
      expect(overflow, dir).toBeLessThanOrEqual(0);
    }
  });

  test(`${kit.key}: reads as a page without JavaScript, and stays out of the index`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/${kit.key}/`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(fillTemplate(landingHead(kit).title, kit));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      siteUrl(demoRoute(kit.key, kit.framework))
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      kit.indexable === false
        ? "noindex, follow"
        : "index, follow, max-image-preview:large"
    );
    await expect(page.locator("main")).toContainText(kit.install);
    await context.close();
  });

  test(`${kit.key}: the landing grid and each page's rail link every feature page`, async ({
    page,
  }) => {
    await page.goto(`/${kit.key}/`);
    const cards = page.locator(".mx-grid .mx-card");
    await expect(cards).toHaveCount(featuresOf(kit).length);
    const first = featuresOf(kit)[0]!;
    await cards.first().click();
    await expect(page).toHaveURL(new RegExp(`/${kit.key}/${first.slug}/$`));
    const rail = page.locator(".mx-rail a");
    await expect(rail).toHaveCount(featuresOf(kit).length);
    await expect(rail.first()).toHaveAttribute("aria-current", "page");
  });

  test(`${kit.key}: the theme toggle darkens the page and survives a reload`, async ({
    page,
  }) => {
    await page.goto(`/${kit.key}/`);
    await page.evaluate(() => localStorage.removeItem("adapttable-demo-theme"));
    await page.reload();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
}
