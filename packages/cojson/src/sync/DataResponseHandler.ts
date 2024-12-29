import {
  CoValueCore,
  CoValueHeader,
  isTryAddTransactionsException,
} from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { PeerEntry, Peers } from "../peer/index.js";
import { SyncService } from "./SyncService.js";
import { BaseMessageHandler, DataMessage, emptyKnownState } from "./types.js";

export type DataMessageHandlerInput = {
  msg: DataMessage;
  peer: PeerEntry;
  entry: CoValueEntry;
};

/**
 * "Data" is a response to our "pull" message. It's a terminal message which must not be responded to.
 * At this stage the coValue state is considered synced between the peer and the node.
 */
export class DataResponseHandler extends BaseMessageHandler {
  constructor(
    private syncService: SyncService,
    private peers: Peers,
    // The reason for this ugly callback here is to avoid having the local node as a dependency in this service,
    // This should be removed after CoValueCore is decoupled from the local node instance
    private createCoValue: (header: CoValueHeader) => CoValueCore,
  ) {
    super();
  }

  async handleAvailable(input: DataMessageHandlerInput): Promise<unknown> {
    const { peer, entry, msg } = input;

    const { coValue } = entry.state as CoValueAvailableState;

    const peerKnownState = { ...coValue.knownState() };

    if (!this.addData(input)) {
      return;
    }

    // Exclude peer that sent us data from sync.
    const peers = this.peers.getInPriorityOrder({ excludedId: peer.id });
    // Assumption - the other peers state is we same as we had
    return this.syncService.syncCoValue(entry, peerKnownState, peers);
  }

  async handleLoading(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;

    // not known by peer
    if (!msg.known) {
      input.entry.dispatch({
        type: "not-found-in-peer",
        peerId: peer.id,
      });
      return;
    }

    if (!msg.header) {
      console.error(
        "Unexpected empty header in message. Data message is a response to a pull request and should be received for available coValue or include the full header.",
        msg.id,
        peer.id,
      );

      return;
    }

    this.makeCoValueAvailable(input);

    if (!this.addData(input)) {
      return;
    }

    // Exclude peer that sent us data from sync.
    const peers = this.peers.getInPriorityOrder({ excludedId: peer.id });
    //  Assumption - the other peers state is unavailable - the same as we had
    return this.syncService.syncCoValue(entry, emptyKnownState(msg.id), peers);
  }

  async handleUnavailable(input: DataMessageHandlerInput) {
    console.error(
      "Unexpected coValue unavailable state in DataResponseHandler",
      input.peer.id,
      input.msg.id,
    );

    return this.handleLoading(input);
  }

  addData(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;
    const { coValue } = entry.state as CoValueAvailableState;

    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      if (anyMissedTransaction) {
        console.error(
          "Unexpected missed transactions in data message",
          peer.id,
          msg,
        );

        return false;
      }
    } catch (e) {
      if (isTryAddTransactionsException(e)) {
        const { message, error } = e;
        console.error(peer.id, message, error);

        peer.erroredCoValues.set(msg.id, error);
      } else {
        console.error("Unknown error", peer.id, e);
      }

      return false;
    }
    return true;
  }

  private makeCoValueAvailable(input: DataMessageHandlerInput): CoValueCore {
    if (!input.msg.header) {
      throw new Error(`Empty header for ${input.msg.id}`);
    }

    const coValue = this.createCoValue(input.msg.header);
    input.entry.dispatch({
      type: "available",
      coValue,
    });

    return coValue;
  }
}
