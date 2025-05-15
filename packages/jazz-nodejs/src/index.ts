import { AgentSecret, CryptoProvider, LocalNode, Peer } from "cojson";
import {
  type AnyWebSocketConstructor,
  WebSocketPeerWithReconnection,
} from "cojson-transport-ws";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import {
  Account,
  AccountClass,
  ID,
  Inbox,
  createJazzContextFromExistingCredentials,
  randomSessionProvider,
} from "jazz-tools";

type WorkerOptions<Acc extends Account> = {
  accountID?: string;
  accountSecret?: string;
  syncServer?: string;
  WebSocket?: AnyWebSocketConstructor;
  AccountSchema?: AccountClass<Acc>;
  crypto?: CryptoProvider;
};

/** @category Context Creation */
export async function startWorker<Acc extends Account>(
  options: WorkerOptions<Acc>,
) {
  const {
    accountID = process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret = process.env.JAZZ_WORKER_SECRET,
    syncServer = "wss://cloud.jazz.tools",
    AccountSchema = Account as unknown as AccountClass<Acc>,
  } = options;

  let node: LocalNode | undefined = undefined;

  const peersToLoadFrom: Peer[] = [];

  const wsPeer = new WebSocketPeerWithReconnection({
    peer: syncServer,
    reconnectionTimeout: 100,
    addPeer: (peer) => {
      if (node) {
        node.syncManager.addPeer(peer);
      } else {
        peersToLoadFrom.push(peer);
      }
    },
    removePeer: () => {},
    WebSocketConstructor: options.WebSocket,
  });

  wsPeer.enable();

  if (!accountID) {
    throw new Error("No accountID provided");
  }
  if (!accountSecret) {
    throw new Error("No accountSecret provided");
  }
  if (!accountID.startsWith("co_")) {
    throw new Error("Invalid accountID");
  }
  if (!accountSecret?.startsWith("sealerSecret_")) {
    throw new Error("Invalid accountSecret");
  }

  const context = await createJazzContextFromExistingCredentials({
    credentials: {
      accountID: accountID as ID<Acc>,
      secret: accountSecret as AgentSecret,
    },
    AccountSchema,
    // TODO: locked sessions similar to browser
    sessionProvider: randomSessionProvider,
    peersToLoadFrom,
    crypto: options.crypto ?? (await WasmCrypto.create()),
  });

  const account = context.account as Acc;
  node = account._raw.core.node;

  if (!account._refs.profile?.id) {
    throw new Error("Account has no profile");
  }

  const inbox = await Inbox.load(account);

  async function done() {
    await context.account.waitForAllCoValuesSync();

    wsPeer.disable();
    context.done();
  }

  const inboxPublicApi = {
    subscribe: inbox.subscribe.bind(inbox) as Inbox["subscribe"],
  };

  return {
    worker: context.account as Acc,
    experimental: {
      inbox: inboxPublicApi,
    },
    waitForConnection() {
      return wsPeer.waitUntilConnected();
    },
    subscribeToConnectionChange(listener: (connected: boolean) => void) {
      wsPeer.subscribe(listener);

      return () => {
        wsPeer.unsubscribe(listener);
      };
    },
    done,
  };
}
