import {
  type IncomingSyncStream,
  type OutgoingSyncQueue,
  type Peer,
  cojsonInternals,
} from "cojson";
import { SyncManager } from "cojson-storage";
import { SQLiteClient } from "./client.js";
import { SQLiteAdapter } from "./sqliteAdapter.js";

export interface SQLiteConfig {
  adapter: SQLiteAdapter;
}

export class SQLiteReactNative {
  private syncManager!: SyncManager;
  private dbClient!: SQLiteClient;
  private initialized: Promise<void>;

  constructor(
    adapter: SQLiteAdapter,
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    // Initialize everything in sequence
    this.initialized = (async () => {
      // 1. First initialize the adapter
      await adapter.initialize();

      // 2. Create and initialize the client
      this.dbClient = new SQLiteClient(adapter, toLocalNode);
      await this.dbClient.ensureInitialized();

      // 3. Only then create the sync manager
      this.syncManager = new SyncManager(this.dbClient, toLocalNode);
    })();

    // Start processing messages only after initialization
    const processMessages = async () => {
      await this.initialized;

      let lastTimer = performance.now();

      for await (const msg of fromLocalNode) {
        try {
          if (msg === "Disconnected" || msg === "PingTimeout") {
            throw new Error("Unexpected Disconnected message");
          }

          await this.syncManager.handleSyncMessage(msg);

          if (performance.now() - lastTimer > 500) {
            lastTimer = performance.now();
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        } catch (e) {
          console.error(
            new Error(
              `Error reading from localNode, handling msg\n\n${JSON.stringify(
                msg,
                (k, v) =>
                  k === "changes" || k === "encryptedChanges"
                    ? `${v.slice(0, 20)}...`
                    : v,
              )}`,
              { cause: e },
            ),
          );
          console.error(e);
        }
      }
    };

    processMessages().catch((e) =>
      console.error("Error in processMessages in sqlite", e),
    );
  }

  static async asPeer(config: SQLiteConfig): Promise<Peer> {
    if (!config.adapter) {
      throw new Error("SQLite adapter is required");
    }

    // Initialize adapter before creating any connections
    await config.adapter.initialize();

    const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
      "localNode",
      "storage",
      {
        peer1role: "client",
        peer2role: "storage",
        trace: false,
        crashOnClose: true,
      },
    );

    // Create SQLiteReactNative instance after adapter is initialized
    const storage = new SQLiteReactNative(
      config.adapter,
      localNodeAsPeer.incoming,
      localNodeAsPeer.outgoing,
    );

    // Wait for full initialization before returning peer
    await storage.initialized;

    return { ...storageAsPeer, priority: 100 };
  }
}
