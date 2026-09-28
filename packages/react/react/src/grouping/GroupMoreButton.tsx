/**
 * The offer that reveals the next page of groups, or of a group's rows.
 *
 * Wording and the part name stay here so they cannot drift. Adapters pass
 * the button the end user clicks.
 */
import type {
  GroupMoreButtonProps,
  GroupMoreButtonSlots as NeutralGroupMoreButtonSlots,
} from "@adapttable/core/binding";
import type { ReactElement, ReactNode } from "react";

export type {
  GroupMoreButtonProps,
  GroupMoreButtonSlotProps,
} from "@adapttable/core/binding";

/**
 * Adapter-supplied controls for {@link GroupMoreButtonChrome} —
 * `@adapttable/core`'s `GroupMoreButtonSlots` drawing React nodes.
 *
 * @public
 */
export type GroupMoreButtonSlots = NeutralGroupMoreButtonSlots<ReactNode>;

/**
 * Props for {@link GroupMoreButtonChrome}.
 *
 * @public
 */
export interface GroupMoreButtonChromeProps extends GroupMoreButtonProps {
  /** The kit's components for each part. */
  readonly slots: GroupMoreButtonSlots;
}

/**
 * Renders the offer through the adapter's button.
 *
 * @public
 */
export function GroupMoreButtonChrome({
  scope,
  remaining,
  groupKey,
  labels,
  onShowMore,
  slots,
}: Readonly<GroupMoreButtonChromeProps>): ReactElement {
  const Button = slots.Button;
  return (
    <Button
      label={
        scope === "groups"
          ? labels.moreGroups(remaining)
          : labels.moreRowsInGroup(remaining)
      }
      onClick={() => {
        onShowMore({ scope, groupKey });
      }}
    />
  );
}
