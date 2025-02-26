import { SendMessageToPeerEffect } from "../effects.js";
import { LocalNodeState } from "../structure.js";

export function stageSyncOut(node: LocalNodeState): {
  effects: SendMessageToPeerEffect[];
} {
  for (const coValue of Object.values(node.coValues)) {
    if (
      coValue.storageState === "pending" ||
      coValue.storageState === "unknown"
    ) {
      continue;
    } else {
      throw new Error("CoValue is not pending or unknown");
    }
  }
  return { effects: [] };
}
