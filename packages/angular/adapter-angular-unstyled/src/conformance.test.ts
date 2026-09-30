import type { AdaptTableFeature, ColumnDef } from "@adapttable/angular";
import { editing } from "@adapttable/angular-unstyled/editing";
import { grouping } from "@adapttable/angular-unstyled/grouping";
import { rowReorder } from "@adapttable/angular-unstyled/row-reorder";
import { virtualize } from "@adapttable/angular-unstyled/virtualize";
import {
  type ConformanceDriver,
  type ConformanceRow,
  type ConformanceScenario,
  tableConformanceTests,
} from "@adapttable/core/conformance";
import { TestBed } from "@angular/core/testing";
import { fireEvent, waitFor } from "@testing-library/dom";

import { AdaptDataTable } from "./dataTable";

function columnsFor(
  scenario: ConformanceScenario
): ColumnDef<ConformanceRow>[] {
  return scenario.columns.map((column) => ({
    key: column.key,
    header: column.header,
    sortable: column.sortable,
    editable: scenario.onCellEdit !== undefined,
    accessor: (row: ConformanceRow) => row[column.key],
  }));
}

/** The features a scenario asks for, drawn with this kit. */
function featuresFor(scenario: ConformanceScenario): AdaptTableFeature[] {
  const { onCellEdit, onRowReorder, groupBy } = scenario;
  return [
    ...(onCellEdit
      ? [
          editing<ConformanceRow>((row, key, value) => {
            onCellEdit(row.id, key, value);
          }),
        ]
      : []),
    ...(onRowReorder
      ? [
          rowReorder<ConformanceRow>((from, to, row) => {
            onRowReorder(from, to, row.id);
          }),
        ]
      : []),
    ...(groupBy ? [grouping(groupBy)] : []),
    ...(scenario.virtualize ? [virtualize()] : []),
  ];
}

const driver: ConformanceDriver = {
  name: "angular-unstyled",
  mount: (scenario) => {
    const fixture = TestBed.createComponent(AdaptDataTable<ConformanceRow>);
    const set = (name: string, value: unknown): void => {
      fixture.componentRef.setInput(name, value);
    };
    set("data", scenario.rows);
    set("columns", columnsFor(scenario));
    set("rowKey", (row: ConformanceRow) => row.id);
    set("tableLabel", scenario.tableLabel);
    set("dir", scenario.dir ?? "ltr");
    set("forceMobile", scenario.mobile ?? false);
    set("labels", scenario.labels);
    set("urlSync", false);
    set("selectable", scenario.selectable ?? false);
    set("cellNavigation", scenario.navigable ?? false);
    set("features", featuresFor(scenario));
    if (scenario.virtualize) {
      set("paginationMode", "infinite");
      set("maxHeight", 200);
    }
    if (scenario.pageSize !== undefined) {
      set("defaults", { limit: scenario.pageSize });
    }
    fixture.autoDetectChanges();
    fixture.detectChanges();
    const container = fixture.nativeElement as HTMLElement;
    document.body.append(container);
    return {
      container,
      unmount: () => {
        fixture.destroy();
        container.remove();
      },
    };
  },
};

describe(`table conformance — ${driver.name}`, () => {
  for (const test of tableConformanceTests(driver, {
    expect,
    fireEvent,
    waitFor,
  })) {
    it(test.name, test.run);
  }
});
