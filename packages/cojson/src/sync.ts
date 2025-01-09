import { ValueType, metrics } from "@opentelemetry/api";
import { CoValueCore } from "./coValueCore.js";
import { CoValueEntry } from "./coValueEntry.js";
import { RawCoID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { PeerEntry, PeerID } from "./peer/index.js";
import { DependencyService } from "./sync/DependencyService.js";
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

  peersCounter = metrics.getMeter("cojson").createUpDownCounter("jazz.peers", {
    description: "Amount of connected peers",
    valueType: ValueType.INT,
    unit: "peer",
  });

  private readonly loadService: LoadService;
  private readonly syncService: SyncService;
  private readonly dependencyService: DependencyService;
  private readonly pullRequestHandler: PullRequestHandler;
  private readonly pushRequestHandler: PushRequestHandler;
  private readonly ackResponseHandler: AckResponseHandler;
  private readonly dataResponseHandler: DataResponseHandler;

  constructor(local: LocalNode) {
    this.local = local;

    this.syncService = new SyncService(
      // onPushContent callback
      ({ entry, peerId }: { entry: CoValueEntry; peerId: PeerID }) => {
        entry.uploadState.setPendingForPeer(peerId);
      },
    );

    this.loadService = new LoadService();
    this.dependencyService = new DependencyService(this, this.loadService);

    this.pullRequestHandler = new PullRequestHandler(this.loadService);
    this.pushRequestHandler = new PushRequestHandler(
      this.syncService,
      // The reason for this ugly callback here is to avoid having the local node as a dependency in the handler,
      // This should be removed after CoValueCore is decoupled from the local node instance
      this.dependencyService,
    );

    /**
     * TODO add peersCounter.add into localNode.addPeer
     *   addPeer(peer: Peer) {
     *     const prevPeer = this.peers[peer.id];
     *     const peerState = new PeerState(peer, prevPeer?.knownStates);
     *     this.peers[peer.id] = peerState;
     *
     *     if (prevPeer && !prevPeer.closed) {
     *       prevPeer.gracefulShutdown();
     *     }
     *
     *     this.peersCounter.add(1, { role: peer.role });
     *
     *     const unsubscribeFromKnownStatesUpdates = peerState.knownStates.subscribe(
     *       (id) => {
     *         this.syncState.triggerUpdate(peer.id, id);
     *       },
     *     );
     *
     *     if (peerState.isServerOrStoragePeer()) {
     *       const initialSync = async () => {
     *         for (const entry of this.local.coValuesStore.getValues()) {
     *           await this.subscribeToIncludingDependencies(entry.id, peerState);
     *
     *           if (entry.state.type === "available") {
     *             await this.sendNewContentIncludingDependencies(entry.id, peerState);
     *           }
     *
     *           if (!peerState.optimisticKnownStates.has(entry.id)) {
     *             peerState.optimisticKnownStates.dispatch({
     *               type: "SET_AS_EMPTY",
     *               id: entry.id,
     *             });
     *           }
     *         }
     *       };
     *       void initialSync();
     *     }
     *
     *     const processMessages = async () => {
     *       for await (const msg of peerState.incoming) {
     *         if (msg === "Disconnected") {
     *           return;
     *         }
     *         if (msg === "PingTimeout") {
     *           console.error("Ping timeout from peer", peer.id);
     *           return;
     *         }
     *         try {
     *           await this.handleSyncMessage(msg, peerState);
     *         } catch (e) {
     *           throw new Error(
     *             `Error reading from peer ${
     *               peer.id
     *             }, handling msg\n\n${JSON.stringify(msg, (k, v) =>
     *               k === "changes" || k === "encryptedChanges"
     *                 ? v.slice(0, 20) + "..."
     *                 : v,
     *             )}`,
     *             { cause: e },
     *           );
     *         }
     *       }
     *     };
     *
     *     processMessages()
     *       .then(() => {
     *         if (peer.crashOnClose) {
     *           console.error("Unexepcted close from peer", peer.id);
     *           this.local.crashed = new Error("Unexpected close from peer");
     *           throw new Error("Unexpected close from peer");
     *         }
     *       })
     *       .catch((e) => {
     *         console.error("Error processing messages from peer", peer.id, e);
     *         if (peer.crashOnClose) {
     *           this.local.crashed = e;
     *           throw new Error(e);
     *         }
     *       })
     *       .finally(() => {
     *         const state = this.peers[peer.id];
     *         state?.gracefulShutdown();
     *         unsubscribeFromKnownStatesUpdates();
     *         this.peersCounter.add(-1, { role: peer.role });
     *
     *         if (peer.deletePeerStateOnClose) {
     *           delete this.peers[peer.id];
     *         }
     *       });
     *   }
     */
    this.ackResponseHandler = new AckResponseHandler(
      // onPushContentAcknowledged callback
      ({ entry, peerId }: { entry: CoValueEntry; peerId: PeerID }) => {
        entry.uploadState.setCompletedForPeer(peerId);
      },
    );

    this.dataResponseHandler = new DataResponseHandler(
      this.dependencyService,
      this.syncService,
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

  async loadCoValue(id: RawCoID): Promise<CoValueCore | "unavailable"> {
    const entry = this.local.coValuesStore.get(id);
    return this.loadService.loadCoValue(entry);
  }

  handleSyncMessage(msg: SyncMessage, peer: PeerEntry) {
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
