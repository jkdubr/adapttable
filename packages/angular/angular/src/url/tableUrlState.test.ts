/**
 * The table's URL state follows configuration given as signals.
 */
import { createMemoryAdapter } from "@adapttable/core";
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  signal,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import { injectTableUrlState } from "./tableUrlState";

describe("injectTableUrlState", () => {
  it("follows defaults given as a signal while the URL is silent, and yields to the URL", () => {
    const injector = createEnvironmentInjector(
      [],
      TestBed.inject(EnvironmentInjector)
    );
    const adapter = createMemoryAdapter();
    const defaults = signal({ limit: 10 });
    const url = injectTableUrlState({
      urlAdapter: adapter,
      defaults,
      injector,
    });
    expect(url.state().limit).toBe(10);
    defaults.set({ limit: 25 });
    expect(url.state().limit).toBe(25);
    url.setLimit(50);
    expect(url.state().limit).toBe(50);
    defaults.set({ limit: 5 });
    expect(url.state().limit).toBe(50);
    injector.destroy();
  });

  it("parses a filter key given later as a list", () => {
    const injector = createEnvironmentInjector(
      [],
      TestBed.inject(EnvironmentInjector)
    );
    const arrayExtraKeys = signal<readonly string[]>([]);
    const url = injectTableUrlState({
      urlAdapter: createMemoryAdapter("f_team=Core,Web"),
      arrayExtraKeys,
      injector,
    });
    expect(url.state().extra.team).toBe("Core,Web");
    arrayExtraKeys.set(["team"]);
    expect(url.state().extra.team).toEqual(["Core", "Web"]);
    injector.destroy();
  });
});
