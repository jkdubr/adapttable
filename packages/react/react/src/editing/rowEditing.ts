/**
 * Editing a whole row at once.
 *
 * Cell editing commits each field as the reader leaves it, which is right for a
 * spreadsheet and wrong for a form: a row whose fields constrain each other
 * cannot be edited one cell at a time without passing through states that are
 * invalid on the way — a start date after an end date it is about to replace.
 *
 * So a row edit holds every field's draft until the reader saves, then hands the
 * host ONE patch. Cancel throws all of it away. The unit changes; nothing else
 * does — the same editors, the same validators, the same save states.
 */
import {
  type EditableColumnLike,
  type FeatureHostState,
  parseCellEditValue,
  readEditableCellValue,
  resolveCellEditor,
} from "@adapttable/core";
import type { RowEditDrafts, RowEditingState } from "@adapttable/core/binding";
import { useCallback, useMemo, useRef, useState } from "react";

import { useEventCallback } from "../hooks/useEventCallback";
import { type EditEventHandler, observeEdit } from "./editingEvents";

export type { RowEditDrafts, RowEditingState };

/**
 * What {@link useRowEditing} needs.
 *
 * @public
 */
export interface UseRowEditingOptions<TRow> {
  /**
   * Whether row editing is armed. Off by default: it changes the commit unit,
   * which is a decision about the data, not a preference.
   */
  enabled?: boolean;
  /** The columns, for seeding drafts and parsing them back. */
  columns: readonly EditableColumnLike<TRow>[];
  /**
   * Take everything the reader changed, as one patch of parsed values keyed by
   * column. The table never writes to a row.
   */
  onRowEdit?: (row: TRow, patch: Readonly<Record<string, unknown>>) => unknown;
  /** An editor opened on this row. */
  onEditStart?: EditEventHandler<TRow>;
  /** The reader threw the drafts away. */
  onEditCancel?: EditEventHandler<TRow>;
  /** The host received the patch. */
  onEditCommit?: EditEventHandler<TRow>;
  /** The table that owns these editors. */
  featureHost?: FeatureHostState;
}

/** Every column a reader may edit on a given row. */
function editableColumns<TRow>(
  columns: readonly EditableColumnLike<TRow>[],
  row: TRow
): EditableColumnLike<TRow>[] {
  return columns.filter((column) => {
    const { editable } = column;
    if (editable === undefined || editable === false) return false;
    return editable === true || editable(row);
  });
}

/**
 * Headless state for editing a row as one unit.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link UseRowEditingOptions}.
 * @returns The state; inert unless `enabled`.
 *
 * @public
 */
export function useRowEditing<TRow>(
  options: UseRowEditingOptions<TRow>
): RowEditingState<TRow> {
  const enabled = options.enabled ?? false;
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<RowEditDrafts>({});
  // A ref beside the state, written in the same tick: a picker that sets a
  // draft and commits in one gesture — the documented pattern for a custom
  // editor — would otherwise save the drafts as they were before its own click.
  const draftsRef = useRef<RowEditDrafts>({});
  // The row and its seeds as they were when the edit opened: what "changed"
  // is measured against, and what the patch is built from. A ref because a
  // save reads them in the same tick a keystroke wrote a draft.
  const opened = useRef<{
    row: TRow;
    rowId: string;
    seeds: RowEditDrafts;
  } | null>(null);

  const begin = useEventCallback((row: TRow, rowId: string) => {
    if (!enabled) return;
    const seeds: Record<string, string> = {};
    for (const column of editableColumns(options.columns, row)) {
      seeds[column.key] = readEditableCellValue(
        row,
        column,
        options.featureHost
      );
    }
    opened.current = { row, rowId, seeds };
    draftsRef.current = seeds;
    setActiveRowId(rowId);
    setDrafts(seeds);
    observeEdit(options.onEditStart, {
      row,
      rowId,
      columnKey: "",
      value: seeds,
      previousValue: row,
      unit: "row",
    });
  });

  const setDraft = useEventCallback((columnKey: string, value: string) => {
    const previous = draftsRef.current[columnKey];
    if (previous === value) return;
    const open = opened.current;
    const seed = open?.seeds[columnKey];
    draftsRef.current = { ...draftsRef.current, [columnKey]: value };
    setDrafts(draftsRef.current);
    // The first time a field leaves what it read, it is the reader's — the
    // same event a batch fires when a row first changes. Opening the form
    // says which row; this says which fields inside it are at stake.
    if (open && previous === seed && value !== seed) {
      observeEdit(options.onEditStart, {
        row: open.row,
        rowId: open.rowId,
        columnKey,
        value,
        previousValue: seed,
        unit: "row",
      });
    }
  });

  const close = useEventCallback((kind: "cancel" | "silent" = "silent") => {
    const open = opened.current;
    if (kind === "cancel" && open) {
      observeEdit(options.onEditCancel, {
        row: open.row,
        rowId: open.rowId,
        columnKey: "",
        value: draftsRef.current,
        previousValue: open.seeds,
        unit: "row",
      });
    }
    opened.current = null;
    draftsRef.current = {};
    setActiveRowId(null);
    setDrafts({});
  });

  const save = useEventCallback(() => {
    const open = opened.current;
    if (!open) return;
    const patch: Record<string, unknown> = {};
    const current = draftsRef.current;
    for (const column of editableColumns(options.columns, open.row)) {
      const draft = current[column.key];
      if (draft === undefined || draft === open.seeds[column.key]) continue;
      patch[column.key] = column.parseValue
        ? column.parseValue(draft, open.row)
        : parseCellEditValue(
            resolveCellEditor(column, options.featureHost) ?? "text",
            draft
          );
    }
    // Saving an untouched row is a write the host never asked for.
    if (Object.keys(patch).length > 0) {
      options.onRowEdit?.(open.row, patch);
      observeEdit(options.onEditCommit, {
        row: open.row,
        rowId: open.rowId,
        columnKey: "",
        value: patch,
        previousValue: open.row,
        unit: "row",
      });
    }
    close("silent");
  });

  const openedRow = useCallback(() => opened.current?.row, []);

  const seeds = useCallback(() => opened.current?.seeds, []);

  /** What the incoming row reads for these fields. */
  const incomingOf = useEventCallback(
    (row: TRow, columnKeys: readonly string[]): Record<string, string> => {
      const values: Record<string, string> = {};
      for (const column of editableColumns(options.columns, row)) {
        if (!columnKeys.includes(column.key)) continue;
        values[column.key] = readEditableCellValue(
          row,
          column,
          options.featureHost
        );
      }
      return values;
    }
  );

  const acceptSeeds = useEventCallback(
    (row: TRow, columnKeys: readonly string[]) => {
      const open = opened.current;
      if (!open) return;
      opened.current = {
        row,
        rowId: open.rowId,
        seeds: { ...open.seeds, ...incomingOf(row, columnKeys) },
      };
    }
  );

  const takeSeeds = useEventCallback(
    (row: TRow, columnKeys: readonly string[]) => {
      const open = opened.current;
      if (!open) return;
      const incoming = incomingOf(row, columnKeys);
      opened.current = {
        row,
        rowId: open.rowId,
        seeds: { ...open.seeds, ...incoming },
      };
      draftsRef.current = { ...draftsRef.current, ...incoming };
      setDrafts(draftsRef.current);
    }
  );

  const isDirty = useMemo(() => {
    const open = opened.current;
    if (!open) return false;
    return Object.entries(drafts).some(
      ([key, value]) => value !== open.seeds[key]
    );
  }, [drafts]);

  const isEditing = useCallback(
    (rowId: string) => activeRowId === rowId,
    [activeRowId]
  );

  const draftFor = useCallback(
    (columnKey: string) => drafts[columnKey] ?? "",
    [drafts]
  );

  const signature = useMemo(
    () =>
      activeRowId === null
        ? ""
        : `${activeRowId}:${Object.entries(drafts)
            .map(([key, value]) => `${key}=${value}`)
            .join("|")}`,
    [activeRowId, drafts]
  );

  return useMemo(
    () => ({
      activeRowId,
      isEditing,
      drafts,
      draftFor,
      begin,
      setDraft,
      save,
      cancel: () => {
        close("cancel");
      },
      isDirty,
      signature,
      openedRow,
      seeds,
      acceptSeeds,
      takeSeeds,
      featureHost: options.featureHost,
    }),
    [
      activeRowId,
      isEditing,
      drafts,
      draftFor,
      begin,
      setDraft,
      save,
      close,
      isDirty,
      signature,
      openedRow,
      seeds,
      acceptSeeds,
      takeSeeds,
      options.featureHost,
    ]
  );
}
