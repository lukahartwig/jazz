import { CoValueCore, isTryAddTransactionsException } from "../coValueCore.js";
import { CoValueAvailableState } from "../coValueEntry.js";
import { LocalNode } from "../exports.js";
import { AbstractMessageHandler } from "./AbstractMessageHandler.js";
import { DependencyService } from "./DependencyService.js";
import { SyncService } from "./SyncService.js";
import { PushMessageHandlerInput, emptyKnownState } from "./types.js";

export class PushRequestHandler extends AbstractMessageHandler {
  constructor(
    protected readonly syncService: SyncService,
    protected readonly dependencyService: DependencyService,
  ) {
    super();
  }

  async handleAvailable(input: PushMessageHandlerInput): Promise<unknown> {
    const { coValue } = input.entry.state as CoValueAvailableState;
    await this.dependencyService.loadUnknownDependencies(input);

    return this.addData(coValue, input);
  }

  async handleUnknown(input: PushMessageHandlerInput) {
    const { msg, entry, peer } = input;
    if (!msg.header) {
      console.error(`Unexpected unavailable state for coValue ${input.msg.id}`);
    }
    entry.moveToLoadingState([peer]);

    return this.routeMessageByEntryState(input);
  }

  async handleLoading(input: PushMessageHandlerInput) {
    if (!input.msg.header) {
      console.error(`Unexpected loading state for coValue ${input.msg.id}`);
      return;
    }

    await this.dependencyService.MakeAvailableWithDependencies(input);

    return this.routeMessageByEntryState(input);
  }

  private async addData(coValue: CoValueCore, input: PushMessageHandlerInput) {
    const { msg, peer, entry } = input;

    const knownState = coValue.knownState();
    const isEmptyKnownState =
      !knownState.header ||
      !knownState.sessions ||
      !Object.keys(knownState.sessions).length;

    const assumedPeerKnownState = isEmptyKnownState
      ? emptyKnownState(knownState.id)
      : { ...knownState };

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

    const peers = LocalNode.peers.getInPriorityOrder({
      excludedId: peer.id,
    });

    await this.syncService.syncCoValue(entry, assumedPeerKnownState, peers);
  }
}
