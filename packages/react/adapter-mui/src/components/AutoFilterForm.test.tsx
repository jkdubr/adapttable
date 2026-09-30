/**
 * The MUI filter form's select field: its options, in the host's language.
 */
import {
  defaultLabels,
  type ExtraFilters,
  type FilterDef,
} from "@adapttable/core";
import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderMui } from "../test-utils";
import { AutoFilterForm } from "./AutoFilterForm";

function renderForm(defs: readonly FilterDef[], extra: ExtraFilters = {}) {
  renderMui(
    <AutoFilterForm
      defs={defs}
      labels={{ ...defaultLabels, filterAll: "Tous" }}
      source={{
        extra,
        setExtra: () => undefined,
        setExtras: () => undefined,
      }}
    />
  );
}

describe("<AutoFilterForm> select labels (MUI)", () => {
  it("offers the no-restriction option in the host's language", () => {
    renderForm([
      {
        key: "status",
        type: "select",
        options: [{ value: "active", label: "Active" }],
      },
    ]);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Status" }));
    const listbox = screen.getByRole("listbox");
    expect(
      within(listbox)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Tous", "Active"]);
  });
});
