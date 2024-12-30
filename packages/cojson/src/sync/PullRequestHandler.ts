import { CoValueCore } from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { LocalNode } from "../localNode.js";
import { PeerEntry } from "../peer/index.js";
import { LoadService } from "./LoadService.js";
import { BaseMessageHandler, PullMessage, emptyKnownState } from "./types.js";

export type PullMessageHandlerInput = {
  msg: PullMessage;
  peer: PeerEntry;
  entry: CoValueEntry;
};

/**
 * "Pull" request must be followed by "data" message response according to the protocol:
 * - Sends new content if it exists.
 * - Sends an empty data message otherwise.
 * - Sends an empty data message with `{ known: false }` in the message if the `coValue` is unknown by local node.
 *
 * Handler initiates a new "pull" requests to load the coValue from peers if it is not known by the node.
 */
export class PullRequestHandler extends BaseMessageHandler {
  constructor(
    private readonly loadService: LoadService,
    private readonly node: LocalNode,
  ) {
    super();
  }

  async handleAvailable(input: PullMessageHandlerInput): Promise<unknown> {
    const { msg, peer, entry } = input;
    const { coValue } = entry.state as CoValueAvailableState;

    const dependencies: CoValueCore[] = [];
    if (!msg.header) {
      // if coValue is not known by peer, the dependencies have to be sent first send
      coValue.getDependedOnCoValues().map((id) => {
        const coValue = this.node.coValuesStore.get(id);
        if (coValue.state.type === "available") {
          dependencies.push(coValue.state.coValue);
        }
      });
    }
    console.log("sending dependencies", dependencies);
    return peer.send.data({
      peerKnownState: msg,
      coValue,
      dependencies,
    });
  }

  async handleLoading(input: PullMessageHandlerInput): Promise<unknown> {
    // We need to wait for the CoValue to be loaded that would resolve the CoValue as available.
    await input.entry.getCoValue();

    return this.handle(input);
  }

  async handleUnavailable(input: PullMessageHandlerInput): Promise<unknown> {
    const { msg, peer, entry } = input;

    // Initiate a new PULL flow
    // If the coValue is known by peer then we try to load it from the sender as well
    const peerToInclude = msg.header ? peer : null;
    void this.loadService.loadCoValue(entry, peerToInclude?.id);

    return peer.send.data({
      peerKnownState: msg,
      coValue: "unknown",
    });
  }
}
