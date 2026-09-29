/**
 * Shared state shapes a framework binding returns from its hooks. Each
 * binding adapts core's stores to its reactivity and hands back these
 * shapes, so a kit reads the same fields in every framework.
 */
import type { RowPatchStreamStatus } from "./status";

/**
 * What the hook reports back.
 *
 * @public
 */
export interface RowPatchStreamState {
  /** What the connection is doing. */
  status: RowPatchStreamStatus;
  /** Why it gave up, when it did. */
  error: Error | null;
  /** Close it for good. */
  close: () => void;
}
