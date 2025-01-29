import { LSMStorage, LocalNode, Peer, RawAccountID } from "cojson";
import { IDBStorage } from "cojson-storage-indexeddb";
import {
  Account,
  AgentID,
  AnonymousJazzAgent,
  AuthMethod,
  CoValue,
  CoValueClass,
  CryptoProvider,
  ID,
  InviteSecret,
  SessionID,
  WasmCrypto,
  createInviteLink as baseCreateInviteLink,
  consumeInviteLink,
  createJazzContext,
} from "jazz-tools";
import { OPFSFilesystem } from "./OPFSFilesystem.js";
import { createWebSocketPeerWithReconnection } from "./createWebSocketPeerWithReconnection.js";
import { StorageConfig, getStorageOptions } from "./storageOptions.js";
export { BrowserDemoAuth } from "./auth/DemoAuth.js";
export { BrowserPasskeyAuth } from "./auth/PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./auth/PassphraseAuth.js";
export { BrowserOnboardingAuth } from "./auth/OnboardingAuth.js";
import { setupInspector } from "./utils/export-account-inspector.js";

setupInspector();

/** @category Context Creation */
export type BrowserContext<Acc extends Account> = {
  me: Acc;
  logOut: () => void;
  // TODO: Symbol.dispose?
  done: () => void;
};

export type BrowserGuestContext = {
  guest: AnonymousJazzAgent;
  logOut: () => void;
  done: () => void;
};

export type BrowserContextOptions<Acc extends Account> = {
  auth: AuthMethod;
  AccountSchema: CoValueClass<Acc> & {
    fromNode: (typeof Account)["fromNode"];
  };
} & BaseBrowserContextOptions;

export type BaseBrowserContextOptions = {
  peer: `wss://${string}` | `ws://${string}`;
  reconnectionTimeout?: number;
  storage?: StorageConfig;
  crypto?: CryptoProvider;
};

/** @category Context Creation */
export async function createJazzBrowserContext<Acc extends Account>(
  options: BrowserContextOptions<Acc>,
): Promise<BrowserContext<Acc>>;
export async function createJazzBrowserContext(
  options: BaseBrowserContextOptions,
): Promise<BrowserGuestContext>;
export async function createJazzBrowserContext<Acc extends Account>(
  options: BrowserContextOptions<Acc> | BaseBrowserContextOptions,
): Promise<BrowserContext<Acc> | BrowserGuestContext>;
export async function createJazzBrowserContext<Acc extends Account>(
  options: BrowserContextOptions<Acc> | BaseBrowserContextOptions,
): Promise<BrowserContext<Acc> | BrowserGuestContext> {
  const crypto = options.crypto || (await WasmCrypto.create());
  let node: LocalNode | undefined = undefined;

  const wsPeer = createWebSocketPeerWithReconnection(
    options.peer,
    options.reconnectionTimeout,
    (peer) => {
      if (node) {
        node.syncManager.addPeer(peer);
      }
    },
  );

  const { useSingleTabOPFS, useIndexedDB } = getStorageOptions(options.storage);

  const peersToLoadFrom: Peer[] = [];

  if (useSingleTabOPFS) {
    peersToLoadFrom.push(
      await LSMStorage.asPeer({
        fs: new OPFSFilesystem(crypto),
        // trace: true,
      }),
    );
  }

  if (useIndexedDB) {
    peersToLoadFrom.push(await IDBStorage.asPeer());
  }

  peersToLoadFrom.push(wsPeer.peer);

  const context =
    "auth" in options
      ? await createJazzContext({
          AccountSchema: options.AccountSchema,
          auth: options.auth,
          crypto,
          peersToLoadFrom,
          sessionProvider: provideBrowserLockSession,
        })
      : await createJazzContext({
          crypto,
          peersToLoadFrom,
        });

  node =
    "account" in context ? context.account._raw.core.node : context.agent.node;

  return "account" in context
    ? {
        me: context.account,
        done: () => {
          wsPeer.done();
          context.done();
        },
        logOut: () => {
          context.logOut();
        },
      }
    : {
        guest: context.agent,
        done: () => {
          wsPeer.done();
          context.done();
        },
        logOut: () => {
          context.logOut();
        },
      };
}

/** @category Auth Providers */
export type SessionProvider = (
  accountID: ID<Account> | AgentID,
) => Promise<SessionID>;

export function provideBrowserLockSession(
  accountID: ID<Account> | AgentID,
  crypto: CryptoProvider,
) {
  let sessionDone!: () => void;
  const donePromise = new Promise<void>((resolve) => {
    sessionDone = resolve;
  });

  let resolveSession: (sessionID: SessionID) => void;
  const sessionPromise = new Promise<SessionID>((resolve) => {
    resolveSession = resolve;
  });

  void (async function () {
    for (let idx = 0; idx < 100; idx++) {
      // To work better around StrictMode
      for (let retry = 0; retry < 2; retry++) {
        // console.debug("Trying to get lock", accountID + "_" + idx);
        const sessionFinishedOrNoLock = await navigator.locks.request(
          accountID + "_" + idx,
          { ifAvailable: true },
          async (lock) => {
            if (!lock) return "noLock";

            const sessionID =
              localStorage[accountID + "_" + idx] ||
              crypto.newRandomSessionID(accountID as RawAccountID | AgentID);
            localStorage[accountID + "_" + idx] = sessionID;

            // console.debug(
            //     "Got lock",
            //     accountID + "_" + idx,
            //     sessionID
            // );

            resolveSession(sessionID);

            await donePromise;
            console.log("Done with lock", accountID + "_" + idx, sessionID);
            return "sessionFinished";
          },
        );

        if (sessionFinishedOrNoLock === "sessionFinished") {
          return;
        }
      }
    }
    throw new Error("Couldn't get lock on session after 100x2 tries");
  })();

  return sessionPromise.then((sessionID) => ({
    sessionID,
    sessionDone,
  }));
}

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  // default to same address as window.location, but without hash
  {
    baseURL = window.location.href.replace(/#.*$/, ""),
    valueHint,
  }: { baseURL?: string; valueHint?: string } = {},
): string {
  return baseCreateInviteLink(value, role, baseURL, valueHint);
}

/** @category Invite Links */
export { parseInviteLink } from "jazz-tools";

/** @category Invite Links */
export async function consumeInviteLinkFromWindowLocation<V extends CoValue>({
  as,
  forValueHint,
  invitedObjectSchema,
}: {
  as?: Account;
  forValueHint?: string;
  invitedObjectSchema: CoValueClass<V>;
}): Promise<
  | {
      valueID: ID<V>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined
> {
  const result = await consumeInviteLink({
    inviteURL: window.location.href,
    as,
    forValueHint,
    invitedObjectSchema,
  });

  if (result) {
    window.history.replaceState(
      {},
      "",
      window.location.href.replace(/#.*$/, ""),
    );
  }

  return result;
}
