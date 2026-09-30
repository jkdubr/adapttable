/**
 * Where the site lives and where each page sits in it.
 *
 * The docs build, the showcase, the sitemap, IndexNow and the redirect pages
 * left at the previous address all import from here, so an address is decided
 * once. The site is served from the root of its own origin. Framework-specific
 * docs and demos live under a framework section (`/react/…`), which leaves room
 * for `/angular/…` and `/vue/…` beside it; pages about the framework-neutral
 * engine and the project itself stay at the root.
 */

/** The published origin. Every absolute URL the site emits starts with it. */
export const ORIGIN = "https://adapttable.orwamahmoud.com";

/** The framework section the current docs and demos are published in. */
export const FRAMEWORK = "react";

/**
 * Docs pages about the framework-neutral packages (`@adapttable/core`,
 * `@adapttable/server`, `@adapttable/ai`) or the project as a whole. They are
 * served at the root; every other docs page is served in {@link FRAMEWORK}.
 */
export const SHARED_DOCS = Object.freeze([
  "concepts",
  "data-tiers",
  "custom-table-source",
  "server-queries",
  "ai",
  "ai-integrations",
  "ai-http",
  "versioning",
  "faq",
  "limitations",
]);

const SHARED = new Set(SHARED_DOCS);

/**
 * The content id of a docs page — its path below the site root without
 * slashes, as Starlight's sidebar and content collection spell it.
 *
 * @param {string} page - The page's `docs/*.md` basename, e.g. `filtering`.
 * @returns {string} `filtering` → `react/filtering`; `concepts` → `concepts`.
 */
export const docsSlug = (page) =>
  SHARED.has(page) ? page : `${FRAMEWORK}/${page}`;

/**
 * The route a docs page is served at.
 *
 * @param {string} page - The page's `docs/*.md` basename.
 * @returns {string} Always with a leading and a trailing slash.
 */
export const docsRoute = (page) => `/${docsSlug(page)}/`;

/**
 * Where a framework's demo pages are mounted inside the composed site: in
 * that framework's section, `/<framework>/demo/`.
 *
 * @param {string} framework - A framework key, e.g. `react`.
 * @returns {string} With a leading and a trailing slash.
 */
export const demoRootOf = (framework) => `/${framework}/demo/`;

/**
 * The demo sections the site serves, by framework: React's under
 * `/react/demo/`, Angular's under `/angular/demo/`.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const DEMO_ROOTS = Object.freeze({
  react: demoRootOf("react"),
  angular: demoRootOf("angular"),
});

/** The route the showcase is mounted at inside the composed site. */
export const DEMO_ROOT = demoRootOf(FRAMEWORK);

/**
 * The route of a showcase page.
 *
 * @param {string} [dir] - The page's directory inside the showcase, e.g.
 *   `mantine/pivot`; omitted for the showcase landing page.
 * @param {string} [framework] - The framework whose demo section serves the
 *   page; {@link FRAMEWORK} when omitted.
 * @returns {string} Always with a trailing slash.
 */
export const demoRoute = (dir = "", framework = FRAMEWORK) => {
  const root = demoRootOf(framework);
  return dir === "" ? root : `${root}${dir}/`;
};

/**
 * An absolute URL on the published site.
 *
 * @param {string} route - A path starting with `/`.
 * @returns {string}
 */
export const siteUrl = (route) => `${ORIGIN}${route}`;
