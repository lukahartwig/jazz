import {
  CoValueCore,
  CoValueHeader,
  isTryAddTransactionsException,
} from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { PeerEntry } from "../peer/PeerEntry.js";
import { Peers } from "../peer/Peers.js";
import { SyncService } from "./SyncService.js";
import { BaseMessageHandler, DataMessage } from "./types.js";

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

  async handle(input: DataMessageHandlerInput): Promise<unknown> {
    const { msg, peer } = input;
    if (!msg.known) {
      input.entry.dispatch({
        type: "not-found-in-peer",
        peerId: peer.id,
      });
      return;
    }

    return super.handle(input);
  }

  async handleAvailable(input: DataMessageHandlerInput): Promise<unknown> {
    const { peer, entry, msg } = input;

    const { coValue } = entry.state as CoValueAvailableState;

    const peerKnownState = { ...coValue.knownState() };

    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      if (anyMissedTransaction) {
        console.error();

        return;
      }
    } catch (e) {
      if (isTryAddTransactionsException(e)) {
        const { message, error } = e;
        console.error(peer.id, message, error);

        peer.erroredCoValues.set(msg.id, error);
      } else {
        console.error("Unknown error", peer.id, e);
      }

      return;
    }

    const peers = this.peers.getInPriorityOrder({ excludedId: peer.id });

    return this.syncService.syncCoValue(coValue, peerKnownState, peers);
  }

  async handleUnavailable(input: DataMessageHandlerInput) {
    const { peer, msg } = input;
    if (!msg.header) {
      console.error(
        "Unexpected empty header in message. Data message is a response to a pull request and should be received for available coValue or include the full header.",
        msg.id,
        peer.id,
      );

      return;
    }

    this.makeCoValueAvailable(input);

    return this.handle(input);
  }

  async handleLoading(input: DataMessageHandlerInput) {
    return this.handleUnavailable(input);
  }

  private makeCoValueAvailable(input: DataMessageHandlerInput) {
    if (!input.msg.header) {
      throw new Error(`Empty header for ${input.msg.id}`);
    }

    const coValue = this.createCoValue(input.msg.header);
    input.entry.dispatch({
      type: "available",
      coValue,
    });
  }
}
