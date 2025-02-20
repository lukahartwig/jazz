import { NotifyListenerEffect } from "../effects.js";
import { LocalNodeState } from "../structure.js";

export function stageNotify(node: LocalNodeState): {
  effects: NotifyListenerEffect[];
} {
  throw new Error("Not implemented");
}
