import {
  CoValueCore,
  CoValueHeader,
  getDependedOnFromContent,
  isTryAddTransactionsException,
} from "../coValueCore.js";
import { CoValueAvailableState, CoValueEntry } from "../coValueEntry.js";
import { LocalNode } from "../localNode.js";
import { PeerEntry, Peers } from "../peer/index.js";
import { SyncManager } from "../sync.js";
import { DependencyService } from "./DependencyService.js";
import { LoadService } from "./LoadService.js";
import { SyncService } from "./SyncService.js";
import {
  BaseMessageHandler,
  CoValueContent,
  DataMessage,
  DataMessageHandlerInput,
  emptyKnownState,
} from "./types.js";

/**
 * "Data" is a response to our "pull" message. It's a terminal message which must not be responded to.
 * At this stage the coValue state is considered synced between the peer and the node.
 */
export class DataResponseHandler extends BaseMessageHandler {
  constructor(
    private readonly syncService: SyncService,
    private readonly peers: Peers,
    private readonly dependencyService: DependencyService,
  ) {
    super();
  }

  async handleAvailable(input: DataMessageHandlerInput): Promise<unknown> {
    const { peer, entry, msg } = input;
    await this.dependencyService.loadUnknownDependencies(input);

    const { coValue } = entry.state as CoValueAvailableState;

    // TODO send syncService.syncCoValue to peers where it was not found in

    // uncomment all below if it doesn't work
    // const peerKnownState = { ...coValue.knownState() };

    return this.addData(input);

    // if (!this.addData(input)) {
    //   return;
    // }

    // Exclude peer that sent us data from sync.
    // const peers = this.peers.getInPriorityOrder({ excludedId: peer.id });
    // Assumption - the other peers state is we same as we had
    // return this.syncService.syncCoValue(entry, peerKnownState, peers);
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

    await this.dependencyService.MakeAvailableWithDependencies(input);

    return this.handle(input);

    // TODO send syncService.syncCoValue to peers where it was not found in
    // uncomment all below if it doesn't work

    // if (!this.addData(input)) {
    //   return;
    // }

    // Exclude peer that sent us data from sync.
    // const peers = this.peers.getInPriorityOrder({ excludedId: peer.id });
    //  Assumption - the other peers state is unavailable - the same as we had
    // return this.syncService.syncCoValue(entry, emptyKnownState(msg.id), peers);
  }

  async handleUnknown(input: DataMessageHandlerInput) {
    const { peer, msg, entry } = input;

    if (msg.asDependencyOf) {
      entry.moveToLoadingState([peer]);
      return this.handle(input);
    }

    console.error(
      "Unexpected coValue unavailable state in DataResponseHandler",
      peer.id,
      msg.id,
    );
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
