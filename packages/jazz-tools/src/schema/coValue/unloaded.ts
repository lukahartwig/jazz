import { ID } from "../../internal.js";
import { CoValueSchema } from "../coMap/schema.js";

export function getUnloadedState<D extends CoValueSchema>(
  schema: D,
  value: ID<D>,
) {
  return {
    $jazzState: "unloaded" as const,
    $jazz: {
      schema,
      id: value,
    },
  };
}

export function getUnauthorizedState<D extends CoValueSchema>(
  schema: D,
  value: ID<D>,
) {
  return {
    $jazzState: "unauthorized" as const,
    $jazz: {
      schema,
      id: value,
    },
  };
}

export function getUnavailableState<D extends CoValueSchema>(
  schema: D,
  value: ID<D>,
) {
  return {
    $jazzState: "unavailable" as const,
    $jazz: { schema, id: value },
  };
}
