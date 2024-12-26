import {
  CoValueCore,
  CoValueHeader,
  isTryAddTransactionsException,
} from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { PeerEntry } from "../peer/PeerEntry.js";
import { Peers } from "../peer/Peers.js";
import { SyncService } from "./SyncService.js";
import { BaseMessageHandler, PushMessage } from "./types.js";

export type PushMessageHandlerInput = {
  msg: PushMessage;
  peer: PeerEntry;
  entry: CoValueEntry;
};

export class PushRequestHandler extends BaseMessageHandler {
  constructor(
    protected readonly syncService: SyncService,
    protected readonly peers: Peers,
    // The reason for this ugly callback here is to avoid having the local node as a dependency in this service,
    // This should be removed after CoValueCore is decoupled from the local node instance
    private readonly createCoValue: (header: CoValueHeader) => CoValueCore,
  ) {
    super();
  }

  async handleAvailable(input: PushMessageHandlerInput): Promise<unknown> {
    const { coValue } = input.entry.state as CoValueAvailableState;

    return this.addData(coValue, input);
  }

  async handleUnavailable(input: PushMessageHandlerInput) {
    const { msg } = input;
    if (!msg.header) {
      console.error(`Unexpected unavailable state for coValue ${input.msg.id}`);
      return;
    }

    this.makeCoValueAvailable(input);

    return this.handle(input);
  }

  async handleLoading(input: PushMessageHandlerInput) {
    if (!input.msg.header) {
      console.error(`Unexpected loading state for coValue ${input.msg.id}`);
      return;
    }

    this.makeCoValueAvailable(input);

    return this.handle(input);
  }

  private makeCoValueAvailable(input: PushMessageHandlerInput) {
    if (!input.msg.header) {
      throw new Error(`Empty header for ${input.msg.id}`);
    }

    const coValue = this.createCoValue(input.msg.header);
    input.entry.dispatch({
      type: "available",
      coValue,
    });
  }

  private async addData(coValue: CoValueCore, input: PushMessageHandlerInput) {
    const { msg, peer } = input;

    const peerKnownState = { ...coValue.knownState() };
    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      anyMissedTransaction
        ? await peer.send.pull({ knownState: coValue.knownState() })
        : await peer.send.ack({ knownState: coValue.knownState() });
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

    await this.syncService.syncCoValue(coValue, peerKnownState, peers);
  }
}
