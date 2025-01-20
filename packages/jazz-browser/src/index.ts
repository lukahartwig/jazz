import { LSMStorage, RawAccountID } from "cojson";
import { IDBStorage } from "cojson-storage-indexeddb";
import {
  Account,
  AgentID,
  CoValue,
  CoValueClass,
  CryptoProvider,
  ID,
  InviteSecret,
  SessionID,
  WasmCrypto,
  cojsonInternals,
  JazzContextManager,
  AccountClass,
} from "jazz-tools";
import { OPFSFilesystem } from "./OPFSFilesystem.js";
import { createWebSocketPeerWithReconnection } from "./createWebSocketPeerWithReconnection.js";
import { StorageConfig, getStorageOptions } from "./storageOptions.js";
import { setupInspector } from "./utils/export-account-inspector.js";
import { BrowserAuthSecretStorage } from "./auth/AuthSecretStorage.js";

setupInspector();

export type BrowserContextOptions<Acc extends Account> = {
  AccountSchema?: AccountClass<Acc>;
  peer: `wss://${string}` | `ws://${string}`;
  reconnectionTimeout?: number;
  storage?: StorageConfig;
  crypto?: CryptoProvider;
  localOnly?: boolean;
  guestMode?: boolean;
};

/** @category Context Creation */
export async function createJazzBrowserContext<Acc extends Account>(
  options: BrowserContextOptions<Acc>,
) {
  const crypto = options.crypto || (await WasmCrypto.create());

  const contextManager = new JazzContextManager<Acc>({
    crypto,
    sessionProvider: provideBrowserLockSession,
    AccountSchema: options.AccountSchema,
    storage: new BrowserAuthSecretStorage(),
  });

  const { useSingleTabOPFS, useIndexedDB } = getStorageOptions(options.storage);

  if (useSingleTabOPFS) {
    contextManager.addPeer(
      await LSMStorage.asPeer({
        fs: new OPFSFilesystem(crypto),
        // trace: true,
      }),
    );
  }

  if (useIndexedDB) {
    contextManager.addPeer(await IDBStorage.asPeer());
  }

  const wsPeer = createWebSocketPeerWithReconnection(
    options.peer,
    options.reconnectionTimeout,
    contextManager,
  );

  if (!options.localOnly) {
    wsPeer.enable();
  }

  function toggleNetwork(enabled: boolean) {
    if (enabled) {
      wsPeer.enable();
    } else {
      wsPeer.disable();
    }
  }

  const authCredentials = await contextManager.getCredentials();

  if (options.guestMode) {
    await contextManager.logInAsGuest();
  } else if (authCredentials) {
    await contextManager.logIn(authCredentials);
  } else {
    // Log in as anonymous user
    const secretSeed = crypto.newRandomSecretSeed();
    const initialSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    const credentials = {
      secretSeed,
      accountSecret: initialSecret,
      isAnonymous: true,
    };

    await contextManager.registerNewAccount(credentials, {
      name: "Anonymous account",
    });
  }

  return { 
    contextManager,
    toggleNetwork,
  }
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
              localStorage.getItem(accountID + "_" + idx) ||
              crypto.newRandomSessionID(accountID as RawAccountID | AgentID);
            localStorage.setItem(accountID + "_" + idx, sessionID);

            // console.debug(
            //     "Got lock",
            //     accountID + "_" + idx,
            //     sessionID
            // );

            resolveSession(sessionID as SessionID);

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
  const coValueCore = value._raw.core;
  let currentCoValue = coValueCore;

  while (currentCoValue.header.ruleset.type === "ownedByGroup") {
    currentCoValue = currentCoValue.getGroup().core;
  }

  const { ruleset, meta } = currentCoValue.header;

  if (ruleset.type !== "group" || meta?.type === "account") {
    throw new Error("Can't create invite link for object without group");
  }

  const group = cojsonInternals.expectGroup(currentCoValue.getCurrentContent());
  const inviteSecret = group.createInvite(role);

  return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${
    value.id
  }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
  inviteURL: string,
):
  | {
      valueID: ID<C>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined {
  const url = new URL(inviteURL);
  const parts = url.hash.split("/");

  let valueHint: string | undefined;
  let valueID: ID<C> | undefined;
  let inviteSecret: InviteSecret | undefined;

  if (parts[0] === "#" && parts[1] === "invite") {
    if (parts.length === 5) {
      valueHint = parts[2];
      valueID = parts[3] as ID<C>;
      inviteSecret = parts[4] as InviteSecret;
    } else if (parts.length === 4) {
      valueID = parts[2] as ID<C>;
      inviteSecret = parts[3] as InviteSecret;
    }

    if (!valueID || !inviteSecret) {
      return undefined;
    }
    return { valueID, inviteSecret, valueHint };
  }
}

/** @category Invite Links */
export function consumeInviteLinkFromWindowLocation<V extends CoValue>({
  as,
  forValueHint,
  invitedObjectSchema,
}: {
  as: Account;
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
  return new Promise((resolve, reject) => {
    const result = parseInviteLink<V>(window.location.href);

    if (result && result.valueHint === forValueHint) {
      as.acceptInvite(result.valueID, result.inviteSecret, invitedObjectSchema)
        .then(() => {
          resolve(result);
          window.history.replaceState(
            {},
            "",
            window.location.href.replace(/#.*$/, ""),
          );
        })
        .catch(reject);
    } else {
      resolve(undefined);
    }
  });
}
