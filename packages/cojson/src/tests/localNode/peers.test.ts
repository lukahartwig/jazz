import { describe, expect, test } from "vitest";
import { addPeer, removePeer } from "../../localNode/actions/peers.js";
import { subscribe } from "../../localNode/actions/subscribing.js";

import { emptyNode } from "../../localNode/structure.js";
import { PeerID } from "../../sync.js";
import { coValueID1, coValueID2 } from "./setup.js";

describe("Modifying peers", () => {
  const node = emptyNode();
  const _1 = subscribe(node, coValueID1);
  const _2 = subscribe(node, coValueID2);

  test("Adding a peer adds it to the node and to every CoValue with an unknown peer state", () => {
    const peerID = "peer1" as PeerID;
    addPeer(node, peerID);
    expect(node.peers).toEqual([peerID]);
    expect(node.coValues[coValueID1].peerState[peerID]).toEqual({
      confirmed: "unknown",
      optimistic: "unknown",
    });
    expect(node.coValues[coValueID2].peerState[peerID]).toEqual({
      confirmed: "unknown",
      optimistic: "unknown",
    });
  });

  test("Removing a peer removes it from the node and from every CoValue", () => {
    const peerID = "peer1" as PeerID;
    removePeer(node, peerID);
    expect(node.peers).toEqual([]);
    expect(node.coValues[coValueID1].peerState[peerID]).toBeUndefined();
    expect(node.coValues[coValueID2].peerState[peerID]).toBeUndefined();
  });
});
