import { expect, type Page, test } from "@playwright/test";

/**
 * The Angular unstyled kit's editing page: native editors in the cell, the
 * host writing each value, a column rule refusing one, and arrow focus.
 */

const PAGE = "/unstyled/editing/";

const part = (page: Page, name: string) =>
  page.locator(`.mx-demo [data-adapttable-part="${name}"]`);

const cell = (page: Page, row: number, column: number) =>
  part(page, "row")
    .nth(row)
    .locator('[data-adapttable-part="cell"]')
    .nth(column);

const log = (page: Page) => page.locator("[data-demo-log]");

test("opens a select on the row's value and saves the new one through the host", async ({
  page,
}) => {
  await page.goto(PAGE);
  await cell(page, 0, 2).dblclick();
  const editor = part(page, "edit-cell-editor");
  await expect(editor).toHaveValue("Planned");
  await editor.selectOption("Blocked");
  await editor.press("Enter");
  await expect(cell(page, 0, 2)).toHaveText("Blocked");
  await expect(log(page)).toHaveText("Saved status for Ada Lovelace: Blocked");
});

test("edits a number and a date in the browser's own controls", async ({
  page,
}) => {
  await page.goto(PAGE);
  await cell(page, 0, 4).dblclick();
  const budget = part(page, "edit-cell-editor");
  await expect(budget).toHaveAttribute("type", "number");
  await budget.fill("12345");
  await budget.press("Enter");
  await expect(cell(page, 0, 4)).toHaveText("$12,345");
  await expect(log(page)).toHaveText("Saved budget for Ada Lovelace: 12345");

  await cell(page, 0, 3).dblclick();
  const start = part(page, "edit-cell-editor");
  await expect(start).toHaveAttribute("type", "date");
  await expect(start).toHaveValue("2026-03-08");
  await start.press("Escape");
  await expect(part(page, "edit-cell-editor")).toHaveCount(0);
});

test("refuses an empty name with the column's own message", async ({
  page,
}) => {
  await page.goto(PAGE);
  await cell(page, 0, 0).dblclick();
  const name = part(page, "edit-cell-editor");
  await name.fill("");
  await name.press("Enter");
  await expect(part(page, "edit-cell-error")).toHaveText("A name is required");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(log(page)).toHaveText("Every change goes through the host.");
});

test("moves a visible focus between cells with the arrow keys", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(part(page, "table")).toHaveAttribute("role", "grid");
  await cell(page, 0, 0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(cell(page, 0, 1)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(cell(page, 1, 1)).toBeFocused();
});

test("undoes and redoes an edit with toolbar controls and grid shortcuts", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(part(page, "undo-button")).toBeDisabled();
  await cell(page, 0, 0).dblclick();
  await part(page, "edit-cell-editor").fill("Ada Updated");
  await part(page, "edit-cell-editor").press("Enter");
  await expect(cell(page, 0, 0)).toHaveText("Ada Updated");
  await part(page, "undo-button").click();
  await expect(cell(page, 0, 0)).toHaveText("Ada Lovelace");
  await part(page, "redo-button").click();
  await expect(cell(page, 0, 0)).toHaveText("Ada Updated");
  await cell(page, 0, 0).focus();
  await page.keyboard.press("Control+z");
  await expect(cell(page, 0, 0)).toHaveText("Ada Lovelace");
  await page.keyboard.press("Control+Shift+z");
  await expect(cell(page, 0, 0)).toHaveText("Ada Updated");
  await cell(page, 0, 0).dblclick();
  const savedMessage = await log(page).textContent();
  await part(page, "edit-cell-editor").press("Control+z");
  await expect(log(page)).toHaveText(savedMessage!);
  await part(page, "edit-cell-editor").press("Escape");
  await expect(cell(page, 0, 0)).toHaveText("Ada Updated");
});
