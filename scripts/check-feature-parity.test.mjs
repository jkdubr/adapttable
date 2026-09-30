/**
 * The feature gap report: the subpaths a private kit still lacks against the
 * kit it is measured by, and what the feature-parity check says about its own
 * files, read from fixture kits built in a temporary directory.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { featureGapReport } from "./check-feature-parity.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "check-feature-parity.mjs"
);
const temps = [];

after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const KITS = [
  { name: "adapter-plain", framework: "react", role: "native" },
  { name: "adapter-verdant", framework: "angular", role: "private" },
];

const REFERENCES = { "adapter-verdant": "adapter-plain" };

const MANIFEST = {
  features: {
    filters: { id: "filters", subpath: "filters" },
    filterTypes: { id: "filter-types", subpath: "filters" },
    tree: { id: "tree", subpath: "tree" },
  },
};

/** Write a package with a manifest exporting the given subpaths. */
function writePackage(root, group, name, subpaths, files = {}) {
  const dir = join(root, "packages", group, name);
  const exports = { ".": "./index.js", "./package.json": "./package.json" };
  for (const subpath of subpaths) exports[`./${subpath}`] = `./${subpath}.js`;
  const manifest = {
    name: `@adapttable/${name.replace(/^adapter-/, "")}`,
    exports,
  };
  for (const [relative, body] of Object.entries({
    "package.json": JSON.stringify(manifest),
    ...files,
  })) {
    mkdirSync(dirname(join(dir, relative)), { recursive: true });
    writeFileSync(join(dir, relative), body);
  }
}

/** Core, both bindings and both kits, with any Angular kit file replaced. */
function fixtureRoot({ subpaths = ["filters"], files = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "adapttable-feature-report-"));
  temps.push(root);
  writePackage(root, "shared", "core", []);
  writePackage(root, "react", "react", []);
  writePackage(root, "angular", "angular", []);
  writePackage(root, "react", "adapter-plain", ["filters", "tree", "preset"], {
    "src/DataTable.tsx":
      "export const Th = (leaf) => <th {...leaf.headerProps} />;\n",
  });
  writePackage(root, "angular", "adapter-verdant", subpaths, {
    "src/dataTable.ts":
      'import { injectDataTable } from "@adapttable/angular";\n',
    // A secondary entry reaches its primary entry by package name.
    "filters/ng-package.json": "{}\n",
    "filters/index.ts":
      'export { AdaptDataTable } from "@adapttable/verdant";\n',
    ...files,
  });
  return root;
}

const report = (root) =>
  featureGapReport({
    root,
    kits: KITS,
    references: REFERENCES,
    manifest: MANIFEST,
  });

const NO_RULE =
  "@adapttable/verdant: no header-props rule for angular in scripts/check-feature-parity.mjs";

describe("featureGapReport", () => {
  it("lists each subpath the reference exports and the kit does not, with its features", () => {
    assert.deepEqual(report(fixtureRoot()), [
      {
        kit: "adapter-verdant",
        reference: "adapter-plain",
        subpaths: [
          { subpath: "./preset", features: [] },
          { subpath: "./tree", features: ["tree"] },
        ],
        problems: [NO_RULE],
      },
    ]);
  });

  it("stops listing a subpath once the kit exports it", () => {
    const [gap] = report(fixtureRoot({ subpaths: ["filters", "tree"] }));
    assert.deepEqual(gap.subpaths, [{ subpath: "./preset", features: [] }]);
  });

  it("reads a secondary entry, where another kit's import is a problem", () => {
    const [gap] = report(
      fixtureRoot({
        files: {
          "filters/index.ts":
            'export { DataTable } from "@adapttable/plain";\n',
        },
      })
    );
    assert.deepEqual(gap.problems, [
      "angular/adapter-verdant/filters/index.ts: imports sibling kit @adapttable/plain",
      NO_RULE,
    ]);
  });

  it("holds an Angular root table to the features-barrel rule", () => {
    const [gap] = report(
      fixtureRoot({
        files: {
          "src/dataTable.ts": 'import * as features from "./features";\n',
        },
      })
    );
    assert.deepEqual(gap.problems, [
      "angular/adapter-verdant/src/dataTable.ts: root table imports the features aggregate barrel",
      NO_RULE,
    ]);
  });
});

describe("check-feature-parity --report", () => {
  it("prints each private kit's gap and exits 0", () => {
    const result = spawnSync(process.execPath, [SCRIPT, "--report"], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /^adapter-angular-unstyled is missing \d+ subpath\(s\) adapter-unstyled exports:$/m
    );
    assert.match(
      result.stdout,
      /^adapter-ng-zorro is missing \d+ subpath\(s\) adapter-antd exports:$/m
    );
  });
});
