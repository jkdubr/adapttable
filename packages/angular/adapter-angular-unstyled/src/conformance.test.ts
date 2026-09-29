import type { ColumnDef } from "@adapttable/angular";
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
    accessor: (row: ConformanceRow) => row[column.key],
  }));
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
