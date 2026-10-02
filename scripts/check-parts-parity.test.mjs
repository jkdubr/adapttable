/**
 * The parts gap report: what a private kit still lacks against the kit it is
 * measured by, read from fixture kits built in a temporary directory.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { partsGapReport } from "./check-parts-parity.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "check-parts-parity.mjs"
);
const temps = [];

after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const KITS = [
  { name: "adapter-plain", framework: "react", role: "native" },
  { name: "adapter-verdant", framework: "angular", role: "private" },
  { name: "adapter-draft", framework: "angular", role: "private" },
];

const REFERENCES = { "adapter-verdant": "adapter-plain" };

/** The React reference: three parts of its own, one from its binding. */
const PLAIN = `export const DataTable = () => (
  <table data-adapttable-part="table">
    <tr {...getRowProps()}><td data-adapttable-part="cell" /></tr>
    <div data-adapttable-part="bulk-bar" />
  </table>
);
`;

/** The Angular kit: `table` in its root, `cell` from a secondary entry. */
const VERDANT = `<table data-adapttable-part="table">
  <tr><td [attr.data-adapttable-part]="'cell'"></td></tr>
</table>
`;

/** Write each file under the package folder, with a manifest. */
function writePackage(root, group, name, files) {
  const dir = join(root, "packages", group, name);
  const manifest = { name: `@adapttable/${name}`, private: true };
  for (const [relative, body] of Object.entries({
    "package.json": JSON.stringify(manifest),
    ...files,
  })) {
    mkdirSync(dirname(join(dir, relative)), { recursive: true });
    writeFileSync(join(dir, relative), body);
  }
}

/** Core, both bindings and the three kits, with any kit file replaced. */
function fixtureRoot(replace = {}) {
  const root = mkdtempSync(join(tmpdir(), "adapttable-parts-report-"));
  temps.push(root);
  writePackage(root, "shared", "core", {
    "src/index.ts":
      'export const CHROME_PARTS = {\n  live: "live-region",\n};\n',
  });
  writePackage(root, "react", "react", {
    "src/index.ts":
      'export const getRowProps = () => ({ "data-adapttable-part": "row" });\n',
  });
  // The Angular binding names `row` itself, so no Angular kit lacks it.
  writePackage(root, "angular", "angular", {
    "src/row.ts": 'export const ROW = { "data-adapttable-part": "row" };\n',
  });
  const files = {
    "adapter-plain": { "src/DataTable.tsx": PLAIN },
    "adapter-verdant": {
      "src/data-table.component.html": VERDANT,
      "bulk/ng-package.json": "{}\n",
      "bulk/src/bulk.component.html": "<div></div>\n",
    },
    "adapter-draft": { "README.md": "No sources yet.\n" },
  };
  for (const kit of KITS) {
    writePackage(root, kit.framework, kit.name, {
      ...files[kit.name],
      ...replace[kit.name],
    });
  }
  return root;
}

const report = (root) =>
  partsGapReport({ root, kits: KITS, references: REFERENCES });

describe("partsGapReport", () => {
  it("lists the parts the reference renders and the private kit does not", () => {
    assert.deepEqual(report(fixtureRoot()), [
      {
        kit: "adapter-verdant",
        reference: "adapter-plain",
        missing: ["bulk-bar"],
      },
    ]);
  });

  it("stops listing a part once a secondary entry of the kit emits it", () => {
    const root = fixtureRoot({
      "adapter-verdant": {
        "bulk/src/bulk.component.html":
          '<div data-adapttable-part="bulk-bar"></div>\n',
      },
    });
    assert.deepEqual(report(root)[0].missing, []);
  });

  it("counts a part supplied by a binding's configured secondary entry", () => {
    const root = fixtureRoot({
      "adapter-plain": {
        "src/pivot.tsx": '<span data-adapttable-part="pivot-row-header" />;\n',
      },
      "adapter-verdant": {
        "src/pivot.ts":
          'export { AdaptPivotRowHeader } from "@adapttable/angular/pivot";\n',
      },
    });
    writePackage(root, "angular", "angular", {
      "pivot/ng-package.json": "{}\n",
      "pivot/rowHeader.ts":
        'export const template = `<span data-adapttable-part="pivot-row-header"></span>`;\n',
      "scratch/not-an-entry.ts":
        'export const template = `<div data-adapttable-part="bulk-bar"></div>`;\n',
      "node_modules/dependency/index.ts":
        'export const template = `<div data-adapttable-part="bulk-bar"></div>`;\n',
    });
    assert.deepEqual(report(root)[0].missing, ["bulk-bar"]);

    rmSync(join(root, "packages/angular/angular/pivot/ng-package.json"));
    assert.deepEqual(report(root)[0].missing, ["bulk-bar", "pivot-row-header"]);
  });

  it("lists a part the reference gets from its binding and the kit lacks", () => {
    const root = fixtureRoot();
    writePackage(root, "angular", "angular", { "src/row.ts": "export {};\n" });
    assert.deepEqual(report(root)[0].missing, ["bulk-bar", "row"]);
  });

  it("reports only private kits that have a reference", () => {
    const root = fixtureRoot();
    const reported = partsGapReport({
      root,
      kits: KITS,
      references: { ...REFERENCES, "adapter-plain": "adapter-verdant" },
    });
    assert.deepEqual(
      reported.map(({ kit }) => kit),
      ["adapter-verdant"]
    );
  });
});

describe("check-parts-parity --report", () => {
  it("prints each private kit's gap and exits 0", () => {
    const result = spawnSync(process.execPath, [SCRIPT, "--report"], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      /^adapter-angular-unstyled is missing \d+ part\(s\) adapter-unstyled renders:$/m
    );
    assert.match(
      result.stdout,
      /^adapter-ng-zorro is missing \d+ part\(s\) adapter-antd renders:$/m
    );
  });
});
