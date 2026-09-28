/**
 * Typed key for the state the optional grouping panel publishes, so every
 * binding's shell reads the same id without importing the panel.
 */
import { featureStateKey } from "../features/featureKeys";
import type { GroupingPanelInteractions } from "./groupingPanelModel";

/** Provider-state key for the optional grouping panel. @public */
export const GROUPING_PANEL_STATE =
  featureStateKey<GroupingPanelInteractions>("grouping-panel");
