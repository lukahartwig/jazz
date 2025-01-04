import { isTryAddTransactionsException } from "../coValueCore.js";
import { CoValueAvailableState } from "../coValueEntry.js";
import { Peers } from "../peer/index.js";
import { AbstractMessageHandler } from "./AbstractMessageHandler.js";
import { DependencyService } from "./DependencyService.js";
import { SyncService } from "./SyncService.js";
import { DataMessageHandlerInput, emptyKnownState } from "./types.js";

/**
 * "Data" is a response to our "pull" message. It's always some data we asked for, initially.
 * It's a terminal message which must not be responded to.
 * At this stage the coValue state is considered synced between the peer and the node.
 */
export class DataResponseHandler extends AbstractMessageHandler {
  constructor(
    private readonly dependencyService: DependencyService,
    private readonly syncService: SyncService,
    private readonly peers: Peers,
  ) {
    super();
  }

  async handleAvailable(input: DataMessageHandlerInput): Promise<void> {
    const { msg, entry } = input;
    await this.dependencyService.loadUnknownDependencies(input);

    this.addData(input);

    // Push data to peers which are not aware of the coValue
    const unawarePeerIds = entry.uploadState.getUnawarePeerIds();

    if (unawarePeerIds.length) {
      void this.syncService.syncCoValue(
        entry,
        emptyKnownState(msg.id),
        this.peers.getMany(unawarePeerIds),
      );
    }
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
      await entry.getCoValue();
      return this.routeMessageByEntryState(input);
    }

    await this.dependencyService.MakeAvailableWithDependencies(input);

    return this.routeMessageByEntryState(input);
  }

  async handleUnknown(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;

    if (!msg.known) {
      input.entry.dispatch({
        type: "not-found-in-peer",
        peerId: peer.id,
      });
      return;
    }

    if (!msg.asDependencyOf) {
      console.error(
        "Unexpected coValue unavailable state in DataResponseHandler",
        peer.id,
        msg.id,
      );
    }

    entry.moveToLoadingState([peer]);

    return this.routeMessageByEntryState(input);
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
}
