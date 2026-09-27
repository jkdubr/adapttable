import { Component, Injector } from "@angular/core";
import { TestBed } from "@angular/core/testing";

import { injectDataTable } from "./dataTable";
import { type AdaptTableFeature, provideAdaptTableFeatures } from "./features";
import { injectFrontendData } from "./frontendData";

const cleanup = vi.fn();
const provided: AdaptTableFeature = {
  setup: (host) => {
    host.registerAggregator("double", (values) => values.length * 2);
    return cleanup;
  },
};
const own: AdaptTableFeature = {
  setup: (host) => {
    host.registerCommand({
      key: "own",
      label: "Own",
      onSelect: () => undefined,
    });
  },
};

@Component({ template: `` })
class Host {
  readonly table = injectDataTable({
    source: injectFrontendData({ data: [{ id: "1" }], urlSync: false }),
    columns: [{ key: "id" }],
    rowKey: (row) => row.id,
    features: [own],
  });
}

describe("feature composition", () => {
  it("sets up provided and own features and disposes them with the table", async () => {
    TestBed.configureTestingModule({
      providers: [provideAdaptTableFeatures(provided)],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.componentInstance.table.featureHost;
    expect(host.aggregators.has("double")).toBe(true);
    expect(host.commands.map((command) => command.key)).toEqual(["own"]);
    fixture.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("shares the empty host when nothing registers", () => {
    const injector = Injector.create({
      providers: [],
      parent: TestBed.inject(Injector),
    });
    const table = TestBed.runInInjectionContext(() =>
      injectDataTable({
        source: injectFrontendData<{ id: string }>({
          data: [],
          urlSync: false,
          injector,
        }),
        columns: [],
        rowKey: (row) => row.id,
        injector,
      })
    );
    expect(table.featureHost.commands).toEqual([]);
  });
});
