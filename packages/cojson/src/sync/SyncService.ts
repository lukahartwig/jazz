import { CoValuesStore } from "../CoValuesStore.js";
import { CoValueCore } from "../coValueCore.js";
import { CoValueEntry } from "../coValueEntry.js";
import { PeerEntry, PeerID } from "../peer/PeerEntry.js";
import { Peers } from "../peer/Peers.js";
import { CoValueKnownState, emptyKnownState } from "./types.js";

export class SyncService {
  constructor(
    private readonly coValuesStore: CoValuesStore,
    private readonly peers: Peers,
    private readonly onPushContent?: ({
      entry,
      peerId,
    }: { entry: CoValueEntry; peerId: PeerID }) => void,
  ) {}

  /**
   * Sends "push" request to peers to broadcast all known coValues state
   * and request to subscribe to those coValues updates (if have not)
   */
  async initialSync(peer: PeerEntry) {
    for (const entry of this.coValuesStore.getValues()) {
      const coValue = this.coValuesStore.expectCoValueLoaded(entry.id);
      // TODO does it make sense to additionally pull dependencies now that we're sending all that we know from here ?
      // Previously we used to send load + content,  see transformOutgoingMessageToPeer()
      await peer.send.push({
        peerKnownState: emptyKnownState(entry.id),
        coValue,
      });

      if (this.onPushContent) {
        this.onPushContent({ entry, peerId: peer.id });
      }
    }
  }

  /**
   * Sends "push" request to peers to broadcast the new known coValue state and request to subscribe to updates if have not
   */
  async syncCoValue(
    coValue: CoValueCore,
    peerKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
    const entry = this.coValuesStore.get(coValue.id);
    const peersToSync = peers || this.peers.getInPriorityOrder();

    for (const peer of peersToSync) {
      if (peer.erroredCoValues.has(coValue.id)) continue;

      await peer.send.push({
        peerKnownState,
        coValue,
      });

      if (this.onPushContent) {
        this.onPushContent({ entry, peerId: peer.id });
      }
    }
  }
}
