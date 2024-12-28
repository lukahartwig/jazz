import { CoValueCore, CoValueHeader } from "./coValueCore.js";
import { CoValueEntry } from "./coValueEntry.js";
import { RawCoID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { PeerEntry, PeerID } from "./peer/index.js";
import {
  AckResponseHandler,
  CoValueKnownState,
  DataResponseHandler,
  LoadService,
  MessageHandlerInterface,
  PullRequestHandler,
  PushRequestHandler,
  SyncMessage,
  SyncService,
} from "./sync/index.js";

export type DisconnectedError = "Disconnected";

export type PingTimeoutError = "PingTimeout";

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
  private readonly ackResponseHandler: AckResponseHandler;
  private readonly dataResponseHandler: DataResponseHandler;

  constructor(local: LocalNode) {
    this.local = local;

    const createCoValue = (header: CoValueHeader) =>
      new CoValueCore(header, this.local);

    this.syncService = new SyncService(
      this.local.peers,
      // onPushContent callback
      ({ entry, peerId }: { entry: CoValueEntry; peerId: PeerID }) => {
        entry.uploadState.setPendingForPeer(peerId);
      },
    );

    this.loadService = new LoadService(this.local.peers);

    this.pullRequestHandler = new PullRequestHandler(this.loadService);
    this.pushRequestHandler = new PushRequestHandler(
      this.syncService,
      this.local.peers,
      // The reason for this ugly callback here is to avoid having the local node as a dependency in the handler,
      // This should be removed after CoValueCore is decoupled from the local node instance
      createCoValue,
    );

    this.ackResponseHandler = new AckResponseHandler(
      // onPushContentAcknowledged callback
      ({ entry, peerId }: { entry: CoValueEntry; peerId: PeerID }) => {
        entry.uploadState.setCompletedForPeer(peerId);
      },
    );

    this.dataResponseHandler = new DataResponseHandler(
      this.syncService,
      this.local.peers,
      // The reason for this ugly callback here is to avoid having the local node as a dependency in the handler,
      // This should be removed after CoValueCore is decoupled from the local node instance
      createCoValue,
    );
  }

  async initialSync(peer: PeerEntry) {
    return this.syncService.initialSync(peer, this.local.coValuesStore);
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
          const entry = this.local.coValuesStore.get(coValue.id);
          await this.syncService.syncCoValue(entry, peersKnownState, peers);
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

    let handler: MessageHandlerInterface;
    switch (msg.action) {
      case "data":
        handler = this.dataResponseHandler;
        break;
      case "push":
        handler = this.pushRequestHandler;
        break;
      case "pull":
        handler = this.pullRequestHandler;
        break;
      case "ack":
        handler = this.ackResponseHandler;
        break;
      default:
        throw new Error(
          `Unknown message type ${(msg as unknown as { action: "string" }).action}`,
        );
    }
    return handler.handle({ msg, peer, entry });
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
