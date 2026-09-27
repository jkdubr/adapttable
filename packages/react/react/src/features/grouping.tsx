/**
 * Grouping — `@adapttable/<kit>/grouping`.
 *
 * Collapse, paging and the flat grouped model live on this entry. A table
 * that never imports it never carries that math. The hooks mount in-tree
 * through {@link GROUPING_LIVE}.
 */
import {
  computePagination,
  devWarn,
  formatGroupBy,
  type GroupByInput,
  groupedRowModel,
  groupedViewSource,
  groupingAggregates,
  groupingIgnoredWarning,
  groupingPanelAggregations,
  type GroupNode,
  groupShowMoreRequest,
  type GroupSort,
  parseGroupBy,
} from "@adapttable/core";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";

import { useGroupCollapse } from "../grouping/useGroupCollapse";
import { useGroupPaging } from "../grouping/useGroupPaging";
import { slotRender } from "./providers";
import { type ChromeExtraSlotProps, GROUPING_LIVE } from "./slotKeys";
import type { StaticTableFeature, TableFeature } from "./tableFeature";

function LiveGrouping({
  chrome,
  props,
  children,
}: ChromeExtraSlotProps<never>): ReactNode {
  const source = chrome.source;
  const requestedGroupBy =
    props.groupBy === undefined ? source.groupBy : props.groupBy;
  const groupByKeys = useMemo(
    () => parseGroupBy(requestedGroupBy),
    [requestedGroupBy]
  );
  const groupCollapse = useGroupCollapse({
    collapsedGroupIds: props.collapsedGroupIds,
    onCollapsedGroupIdsChange: props.onCollapsedGroupIdsChange,
  });
  // Only the fields grouping reads, so a source change elsewhere — a page, a
  // search — does not rebuild the grouped model.
  const groupingSource = useMemo(
    () => ({
      allFilteredRows: source.allFilteredRows,
      groups: source.groups,
      capabilities: source.capabilities,
      honorsAggregates: source.honorsAggregates,
      aggregateOperations: source.aggregateOperations,
      groupAggregateOverrides: source.groupAggregateOverrides,
      queryAggregates: source.queryAggregates,
      groupAggregations: source.groupAggregations,
    }),
    [
      source.allFilteredRows,
      source.groups,
      source.capabilities,
      source.honorsAggregates,
      source.aggregateOperations,
      source.groupAggregateOverrides,
      source.queryAggregates,
      source.groupAggregations,
    ]
  );
  const ignoredWarning = groupingIgnoredWarning(groupByKeys, groupingSource);
  useEffect(() => {
    if (ignoredWarning !== undefined) devWarn(ignoredWarning);
  }, [groupByKeys, ignoredWarning]);

  const { onGroupByChange } = props;
  const { setGroupBy: sourceSetGroupBy } = source;
  const setGroupBy = useCallback(
    (key: GroupByInput) => {
      sourceSetGroupBy(formatGroupBy(key));
      onGroupByChange?.(parseGroupBy(key));
    },
    [onGroupByChange, sourceSetGroupBy]
  );
  const getRowId = chrome.getRowId;
  const groupPaging = useGroupPaging();
  const {
    groupAggregates,
    groupFooters,
    groupSort,
    groupFilter,
    groupPageSize,
    groupRowPageSize,
    onGroupLoadMore,
    extraRows,
    locale,
  } = props;
  const aggregates = useMemo(
    () =>
      groupingAggregates({
        source: groupingSource,
        columns: chrome.allColumns,
        groupAggregates,
        panelDeclared: chrome.groupingPanel?.declaredAggregates,
      }),
    [chrome.allColumns, chrome.groupingPanel, groupAggregates, groupingSource]
  );

  const grouping = useMemo(() => {
    const model = groupedRowModel({
      groupByKeys,
      source: groupingSource,
      columns: chrome.allColumns,
      locale,
      getRowId,
      collapsedGroupIds: groupCollapse.collapsedGroupIds,
      aggregates,
      groupFooters,
      groupSort,
      groupFilter,
      groupPageSize,
      groupRowPageSize,
      paging: groupPaging.paging,
      extraRows,
    });
    if (!model) return undefined;
    const { openGroups } = model;
    return {
      groupBy: groupByKeys,
      collapsed: groupCollapse,
      aggregates: aggregates.aggregates,
      entries: model.entries,
      setGroupBy,
      showMore: (entry: { scope: "groups" | "rows"; groupKey?: string }) => {
        const request = groupShowMoreRequest(entry, {
          groupPageSize,
          groupRowPageSize,
        });
        groupPaging.showMore(request.pageSize, request.groupKey);
        if (request.loadMoreKey !== undefined) {
          onGroupLoadMore?.(request.loadMoreKey);
        }
      },
      expandAll: groupCollapse.expandAll,
      collapseAll: () => {
        groupCollapse.collapseToDepth(0, openGroups);
      },
      collapseToDepth: (depth: number) => {
        groupCollapse.collapseToDepth(depth, openGroups);
      },
    };
  }, [
    groupByKeys,
    locale,
    groupingSource,
    getRowId,
    groupCollapse,
    aggregates,
    groupFooters,
    groupSort,
    groupFilter,
    groupPageSize,
    groupRowPageSize,
    onGroupLoadMore,
    extraRows,
    groupPaging,
    setGroupBy,
    chrome.allColumns,
  ]);

  const viewSource = grouping ? groupedViewSource(source) : source;
  const groupingArmed = grouping !== undefined;
  const groupingPanel = useMemo(() => {
    if (!chrome.groupingPanel) return undefined;
    return {
      ...chrome.groupingPanel,
      groupBy: groupByKeys,
      aggregations: groupingPanelAggregations({
        source: groupingSource,
        columns: chrome.allColumns,
        declared: chrome.groupingPanel.declaredAggregates,
        entries: grouping?.entries,
      }),
    };
  }, [
    chrome.allColumns,
    chrome.groupingPanel,
    groupByKeys,
    grouping,
    groupingSource,
  ]);
  return children({
    ...chrome,
    grouping,
    groupingPanel,
    groupingArmed,
    source: viewSource,
    editingRows: viewSource.rows,
    hasRowReorder: chrome.hasRowReorder,
    rowReorder: chrome.rowReorder,
    table: {
      ...chrome.table,
      pagination: computePagination({
        page: viewSource.page,
        limit: viewSource.limit,
        total: viewSource.total,
      }),
    },
  });
}

/**
 * What grouping can be told that says nothing about the row type.
 *
 * Paging, collapse state and the footer flag are the same whatever the table
 * holds, so configuring only these keeps the feature row-independent — and
 * composable into any table with no annotation.
 *
 * @public
 */
export interface StaticGroupingExtras {
  /** Told when the keys change, so a host can mirror them. */
  onGroupByChange?: (groupBy: readonly string[]) => void;
  /** Draw a footer row under each group. */
  groupFooters?: boolean;
  /** Show this many groups at a time. */
  groupPageSize?: number;
  /** Show this many rows inside each group. */
  groupRowPageSize?: number;
  /**
   * Keep only the groups this accepts. Row-independent here; the row-aware
   * {@link GroupingExtras} types the group's rows.
   */
  groupFilter?: (group: GroupNode<unknown>) => boolean;
  /** Controlled collapse state. */
  collapsedGroupIds?: readonly string[];
  /** Told when a group opens or closes. */
  onCollapsedGroupIdsChange?: (ids: string[]) => void;
  /** Fetch the rest of a group on demand. */
  onGroupLoadMore?: (groupKey: string) => void;
}

/**
 * Everything grouping can be told, including the row-shaped parts.
 *
 * Supplying either of the two below makes the feature row-aware, and the row
 * comes from the callback you wrote — no type argument needed.
 *
 * @public
 */
export interface GroupingExtras<TRow> extends Omit<
  StaticGroupingExtras,
  "groupFilter"
> {
  /** Per-group subtotals, the same mapper shape as `summaryRow`. */
  groupAggregates?: (rows: readonly TRow[]) => unknown;
  /** Order the groups themselves. */
  groupSort?: GroupSort<TRow>;
  /** Keep only the groups this accepts — each with its value, label and rows. */
  groupFilter?: (group: GroupNode<TRow>) => boolean;
}

/**
 * Group rows under collapsible headers.
 *
 * By a key alone this says nothing about the row type, so it composes into any
 * table with no annotation. Pass {@link GroupingExtras} and it becomes
 * row-aware, taking its row from the callback you supplied.
 *
 * @public
 */
export function grouping(
  groupBy: string | readonly string[]
): StaticTableFeature;
/**
 * Group rows with row-aware extras.
 *
 * @public
 */
export function grouping<TRow>(
  groupBy: string | readonly string[],
  extras: GroupingExtras<TRow>
): TableFeature<TRow>;
/**
 * Group rows under collapsible headers.
 *
 * @public
 */
export function grouping<TRow>(
  groupBy: string | readonly string[],
  extras?: GroupingExtras<TRow>
): TableFeature<TRow> {
  return {
    id: "grouping",
    apply: () => ({ groupBy, ...extras }),
    renders: [
      slotRender(GROUPING_LIVE, (props) => <LiveGrouping {...props} />),
    ],
  };
}

export type { GroupSort } from "@adapttable/core";
