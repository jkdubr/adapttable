/**
 * The one entry every Angular kit's matrix page boots — the Angular
 * counterpart of `src/entry-matrix.tsx`.
 *
 * Which page this is comes from `#root`'s `data-matrix-page`, written into the
 * served HTML by `scripts/build-showcase-html.mjs`, so the dev server
 * (`/unstyled/filtering/`) and the published site (`/angular/demo/unstyled/…`)
 * boot the same file without either knowing the other's mount point.
 */
import "../styles.css";

import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

import { resolveMatrixRoute } from "../matrix/content";
import { AdaptShowcaseMatrixPage, MATRIX_PAGE } from "./matrixPage";

const container = document.getElementById("root");
if (!container) throw new Error("the showcase page has no #root to mount into");

/** The framework this entry serves: the kits whose matrix pages boot it. */
const FRAMEWORK = "angular";

const id = container.dataset.matrixPage ?? "";
const route = resolveMatrixRoute(id, FRAMEWORK);
if (!route) {
  // The page's static copy stays on screen rather than being replaced by a
  // blank root, and the fault is reported instead of being swallowed.
  throw new Error(
    `the matrix does not build a ${FRAMEWORK} page called "${id}"`
  );
}

/** `..` from an adapter landing, `../..` from one of its feature pages. */
const root = "..".concat("/..".repeat(id.split("/").length - 1));

container.replaceChildren(document.createElement("adapt-showcase-matrix-page"));
await bootstrapApplication(AdaptShowcaseMatrixPage, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: MATRIX_PAGE, useValue: { route, root } },
  ],
});
