import { CoValueEntry } from "../coValueEntry.js";
import { PeerEntry, PeerID } from "../peer/PeerEntry.js";
import { AckMessage, BaseMessageHandler } from "./types.js";

export type AckMessageHandlerInput = {
  msg: AckMessage;
  peer: PeerEntry;
  entry: CoValueEntry;
};

export class AckResponseHandler extends BaseMessageHandler {
  constructor(
    private onPushContentAcknowledged?: ({
      entry,
      peerId,
    }: { entry: CoValueEntry; peerId: PeerID }) => void,
  ) {
    super();
  }

  async handleAvailable(input: AckMessageHandlerInput) {
    if (this.onPushContentAcknowledged) {
      this.onPushContentAcknowledged({
        entry: input.entry,
        peerId: input.peer.id,
      });
    }
  }

  async handleLoading(input: AckMessageHandlerInput) {
    console.error(
      "Unexpected loading state. Ack message is a response to a push request and should not be received for loading coValue.",
      input.msg.id,
      input.peer.id,
    );
  }

  async handleUnavailable(input: AckMessageHandlerInput) {
    console.error(
      "Unexpected unavailable state. Ack message is a response to a push request and should not be received for unavailable coValue.",
      input.msg.id,
      input.peer.id,
    );
  }
}
