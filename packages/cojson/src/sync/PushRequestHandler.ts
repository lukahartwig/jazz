import { CoValueCore, isTryAddTransactionsException } from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { PeerEntry } from "../peer/PeerEntry.js";
import { Peers } from "../peer/Peers.js";
import { SyncService } from "./SyncService.js";
import { BaseRequestHandler, PushMessage } from "./types.js";

export type PushMessageHandlerInput = {
  msg: PushMessage;
  peer: PeerEntry;
  entry: CoValueEntry;
};

export class PushRequestHandler extends BaseRequestHandler {
  constructor(
    protected readonly syncService: SyncService,
    protected readonly peers: Peers,
  ) {
    super();
  }

  async handleAvailable(input: PushMessageHandlerInput): Promise<unknown> {
    const { coValue } = input.entry.state as CoValueAvailableState;

    return this.addData(coValue, input);
  }

  async handleUnavailable(input: PushMessageHandlerInput) {
    console.error(`Unexpected unavailable state for coValue ${input.msg.id}`);
  }

  async handleLoading(input: PushMessageHandlerInput) {
    console.error(`Unexpected loading state for coValue ${input.msg.id}`);
  }

  private async addData(coValue: CoValueCore, input: PushMessageHandlerInput) {
    const { msg, peer, entry } = input;

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
