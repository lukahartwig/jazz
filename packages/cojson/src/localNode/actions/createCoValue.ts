import { CoValueHeader } from "../../coValueCore.js";
import { SendMessageToPeerEffect, WriteToStorageEffect } from "../effects.js";
import { LocalNodeState } from "../structure.js";

export function createCoValue(
  node: LocalNodeState,
  header: CoValueHeader,
): {
  effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
} {
  throw new Error("Not implemented");
}
