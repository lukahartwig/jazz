import type { CoValue, RefsToResolve, Resolved } from "../internal.js";
import type { JazzError } from "./JazzError.js";

export type SubscriptionValue<D extends CoValue, R extends RefsToResolve<D>> =
  | { type: "loaded"; value: Resolved<D, R>; id: string }
  | JazzError;
export type Unloaded = { type: "unloaded"; id: string };
