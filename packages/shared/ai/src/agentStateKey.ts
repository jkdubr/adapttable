/**
 * The feature-state key a binding publishes its live agent session under.
 *
 * Defined here, beside the session it carries, so every framework's agent
 * binding publishes and reads the same key.
 */
import { featureStateKey } from "@adapttable/core/binding";

import type { AgentSession } from "./types";

/**
 * Feature-state key for the live {@link AgentSession}.
 *
 * @public
 */
export const TABLE_AGENT_STATE = featureStateKey<AgentSession>("table-agent");
