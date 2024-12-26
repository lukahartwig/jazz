import {
  CoValueCore,
  CoValueHeader,
  isTryAddTransactionsException,
} from "./coValueCore.js";
import { CoValueEntry } from "./coValueEntry.js";
import { RawCoID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { Peer, PeerEntry, PeerID } from "./peer/PeerEntry.js";
import { LoadService } from "./sync/LoadService.js";
import { PullRequestHandler } from "./sync/PullRequestHandler.js";
import { PushRequestHandler } from "./sync/PushRequestHandler.js";
import { SyncService } from "./sync/SyncService.js";
import {
  AckMessage,
  CoValueKnownState,
  DataMessage,
  MessageHandlerInterface,
  PullMessage,
  PushMessage,
  SyncMessage,
} from "./sync/types.js";

export type DisconnectedError = "Disconnected";

export type PingTimeoutError = "PingTimeout";

const setUploadStarted = ({
  entry,
  peerId,
}: { entry: CoValueEntry; peerId: PeerID }) => {
  entry.uploadState.setPendingForPeer(peerId);
};

const setUploadFinished = ({
  entry,
  peerId,
}: { entry: CoValueEntry; peerId: PeerID }) => {
  entry.uploadState.setCompletedForPeer(peerId);
};

export class SyncManager {
  local: LocalNode;
  requestedSyncs: {
    [id: RawCoID]:
      | { done: Promise<void>; nRequestsThisTick: number }
      | undefined;
  } = {};

  private readonly loadService: LoadService;
  private readonly syncService: SyncService;
  private readonly pullRequestHandler: PullRequestHandler;
  private readonly pushRequestHandler: PushRequestHandler;

  constructor(local: LocalNode) {
    this.local = local;

    this.syncService = new SyncService(
      this.local.coValuesStore,
      this.local.peers,
      setUploadStarted,
    );

    this.loadService = new LoadService(this.local.peers);
    this.pullRequestHandler = new PullRequestHandler(this.loadService);
    this.pushRequestHandler = new PushRequestHandler(
      this.syncService,
      this.local.peers,
    );
  }

  async initialSync(peerData: Peer, peer: PeerEntry) {
    return this.syncService.initialSync(peerData, peer);
  }

  async syncCoValue(
    coValue: CoValueCore,
    peersKnownState: CoValueKnownState,
    peers?: PeerEntry[],
  ) {
    if (this.requestedSyncs[coValue.id]) {
      this.requestedSyncs[coValue.id]!.nRequestsThisTick++;
      return this.requestedSyncs[coValue.id]!.done;
    } else {
      const done = new Promise<void>((resolve) => {
        queueMicrotask(async () => {
          delete this.requestedSyncs[coValue.id];

          await this.syncService.syncCoValue(coValue, peersKnownState, peers);
          resolve();
        });
      });

      this.requestedSyncs[coValue.id] = {
        done,
        nRequestsThisTick: 1,
      };
      return done;
    }
  }

  async loadCoValue(
    id: RawCoID,
    peerIdToInclude?: PeerID,
  ): Promise<CoValueCore | "unavailable"> {
    const entry = this.local.coValuesStore.get(id);
    return this.loadService.loadCoValue(entry, peerIdToInclude);
  }

  async handleSyncMessage(msg: SyncMessage, peer: PeerEntry) {
    // TODO errored coValues?
    if (peer.erroredCoValues.has(msg.id)) {
      console.error(
        `Skipping message ${msg.action} on errored coValue ${msg.id} from peer ${peer.id}`,
      );
      return;
    }
    const entry = this.local.coValuesStore.get(msg.id);

    const actualizeCoValueEntry = (msg: PushMessage) => {
      if (entry.state.type !== "available") {
        if (!msg.header) {
          console.error(
            "Expected header to be sent in first message",
            msg.id,
            peer.id,
          );
          return false;
        }

        const coValue = new CoValueCore(msg.header, this.local);

        this.local.coValuesStore.setAsAvailable(msg.id, coValue);
      }

      return true;
    };

    let handler: MessageHandlerInterface;
    switch (msg.action) {
      case "data":
        return this.handleData(msg, peer);
      case "push":
        if (!actualizeCoValueEntry(msg)) return;

        handler = this.pushRequestHandler;
        break;
      case "pull":
        handler = this.pullRequestHandler;
        break;
      case "ack":
        return this.handleAck(msg, peer);

      default:
        throw new Error(
          `Unknown message type ${(msg as unknown as { action: "string" }).action}`,
        );
    }
    return handler.handle({ msg, peer, entry });
  }

  /**
   * "Data" is a response to our "pull" message. It's a terminal message which must not be responded to.
   * At this stage the coValue state is considered synced between the peer and the node.
   */
  async handleData(msg: DataMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (!msg.known) {
      entry.markAsNotFoundInPeer(peer.id);
      return;
    }

    if (!msg.header && entry.state.type !== "available") {
      console.error(
        peer.id,
        msg.id,
        '!!! We should never be here. "Data" action is a response to our specific request.',
      );
      return;
    }

    let coValue: CoValueCore;
    if (entry.state.type !== "available") {
      coValue = new CoValueCore(msg.header as CoValueHeader, this.local);

      this.local.coValuesStore.setAsAvailable(msg.id, coValue);
    } else {
      coValue = entry.state.coValue;
    }

    const peerKnownState = { ...coValue.knownState() };

    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      if (anyMissedTransaction) {
        console.error(
          peer.id,
          msg.id,
          '!!! We should never be here. "Data" action is a response to our specific request.',
        );
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

    const peers = this.local.peers.getInPriorityOrder({ excludedId: peer.id });

    return this.syncCoValue(coValue, peerKnownState, peers);
  }

  async handlePush(msg: PushMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    let coValue: CoValueCore;

    if (entry.state.type !== "available") {
      if (!msg.header) {
        console.error("Expected header to be sent in first message");
        return;
      }

      coValue = new CoValueCore(msg.header, this.local);

      this.local.coValuesStore.setAsAvailable(msg.id, coValue);
    } else {
      coValue = entry.state.coValue;
    }

    const peerKnownState = { ...coValue.knownState() };
    try {
      const anyMissedTransaction = coValue.addNewContent(msg);

      anyMissedTransaction
        ? void peer.send.pull({ knownState: coValue.knownState() })
        : void peer.send.ack({ knownState: coValue.knownState() });
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

    const peers = this.local.peers.getInPriorityOrder({ excludedId: peer.id });

    await this.syncCoValue(coValue, peerKnownState, peers);
  }

  async handleAck(msg: AckMessage, peer: PeerEntry) {
    const entry = this.local.coValuesStore.get(msg.id);

    if (entry.state.type !== "available") {
      console.error(
        '!!! We should never be here. "Ack" action is a response to our specific request.',
      );
      return;
    }

    entry.uploadState.setCompletedForPeer(peer.id);
  }

  async waitForUploadIntoPeer(peerId: PeerID, id: RawCoID) {
    const entry = this.local.coValuesStore.get(id);
    if (!entry) {
      throw new Error(`Unknown coValue ${id}`);
    }

    if (entry.uploadState.isCoValueFullyUploadedIntoPeer(peerId)) {
      return true;
    }

    return entry.uploadState.waitForPeer(peerId);
  }
}
