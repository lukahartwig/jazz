import { RawCoID } from "../../exports.js";
import { ListenerID, LocalNodeState, emptyCoValueState } from "../structure.js";

export function subscribe(
  node: LocalNodeState,
  id: RawCoID,
): {
  listenerID: ListenerID;
} {
  const existing = node.coValues[id];
  if (!existing) {
    const entry = emptyCoValueState(id);
    entry.listeners[1] = "unknown";
    node.coValues[id] = entry;
    return { listenerID: 1 };
  } else {
    const nextListenerID = Object.keys(existing.listeners).length + 1;
    existing.listeners[nextListenerID] = "unknown";
    return { listenerID: nextListenerID };
  }
}

export function unsubscribe(
  node: LocalNodeState,
  id: RawCoID,
  listenerID: ListenerID,
) {
  const existing = node.coValues[id];
  if (!existing) {
    throw new Error("CoValue not found");
  }
  delete existing.listeners[listenerID];
}
