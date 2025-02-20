import { PeerID } from "../../sync.js";
import { LocalNodeState } from "../structure.js";

export function addPeer(node: LocalNodeState, peerID: PeerID) {
  node.peers.push(peerID);
  for (const coValue of Object.values(node.coValues)) {
    coValue.peerState[peerID] = {
      confirmed: "unknown",
      optimistic: "unknown",
    };
  }
}

export function removePeer(node: LocalNodeState, peerID: PeerID) {
  const index = node.peers.indexOf(peerID);
  if (index === -1) {
    throw new Error("Peer not found");
  }
  node.peers.splice(index, 1);
  for (const coValue of Object.values(node.coValues)) {
    delete coValue.peerState[peerID];
  }
}
