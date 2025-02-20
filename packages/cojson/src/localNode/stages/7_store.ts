import { WriteToStorageEffect } from "../effects.js";
import { LocalNodeState } from "../structure.js";

export function stageStore(node: LocalNodeState): {
  effects: WriteToStorageEffect[];
} {
  throw new Error("Not implemented");
}
