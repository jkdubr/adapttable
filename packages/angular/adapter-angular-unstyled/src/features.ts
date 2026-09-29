/**
 * The unstyled kit's features: each one turns a capability on and fills its
 * slot with this kit's native controls. A table composes only the features
 * it lists, and an unlisted feature's components stay out of the build.
 */
import {
  type AdaptTableFeature,
  COLUMN_MENU,
  coreColumnMenu,
  extendFeature,
  slotRender,
} from "@adapttable/angular";

import { AdaptColumnMenu } from "./columnMenu";

/**
 * The Columns menu: show, hide, reorder, pin, rename and auto-size columns,
 * drawn with a native button and popover.
 *
 * @public
 */
export function columnMenu(): AdaptTableFeature {
  return extendFeature(coreColumnMenu(), [
    slotRender(COLUMN_MENU, () => AdaptColumnMenu),
  ]);
}
