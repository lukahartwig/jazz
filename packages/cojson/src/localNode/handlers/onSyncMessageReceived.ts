import { SyncMessage } from "../../exports.js";
import { PeerID } from "../../sync.js";
import { LocalNodeState } from "../structure.js";

export function onSyncMessageReceived(
  node: LocalNodeState,
  message: SyncMessage,
  fromPeer: PeerID,
  priority: number,
) {
  throw new Error("Not implemented");
}
