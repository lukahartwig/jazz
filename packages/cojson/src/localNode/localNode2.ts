import { CoValueHeader, Transaction } from "../coValueCore.js";
import { Hash, Signature, SignerID, StreamingHash } from "../crypto/crypto.js";
import {
  AgentID,
  AgentSecret,
  CryptoProvider,
  JsonValue,
  Peer,
  RawCoID,
  SessionID,
  SyncMessage,
} from "../exports.js";
import { getGroupDependentKey, isAgentID } from "../ids.js";
import { parseJSON } from "../jsonStringify.js";
import { StoredSessionLog } from "../storage.js";
import { PeerID } from "../sync.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";

export type TransactionState =
  | {
      state: "availableInStorage";
    }
  | {
      state: "loadingFromStorage";
    }
  | {
      state: "available";
      tx: Transaction;
      signature: Signature | null;
    }
  | {
      state: "verified";
      tx: Transaction;
      signature: Signature | null;
      validity:
        | { type: "unknown" }
        | { type: "pending" }
        | { type: "valid" }
        | { type: "invalid"; reason: string };
      decryptionState:
        | {
            type: "notDecrypted";
          }
        | {
            type: "decrypted";
            changes: JsonValue[];
          }
        | {
            type: "error";
            error: Error;
          };
      stored: boolean;
    }
  | {
      state: "verificationFailed";
      tx: Transaction;
      signature: Signature | null;
      reason: string;
      hash: Hash | null;
    };

export type SessionEntry = {
  id: SessionID;
  transactions: TransactionState[];
  streamingHash: StreamingHash | null;
  lastAvailable: number;
  lastDepsAvailable: number;
  lastVerified: number;
  lastDecrypted: number;
};

type KnownState =
  | {
      header: boolean;
      sessions: { [key: SessionID]: number };
    }
  | "unknown"
  | "unavailable";

interface CoValueEntry {
  id: RawCoID;
  header: CoValueHeader | null;
  sessions: { [key: SessionID]: SessionEntry };
  storageState: KnownState | "pending";
  peerState: {
    [key: PeerID]: {
      confirmed: KnownState | "pending";
      optimistic: KnownState;
    };
  };
  listeners: { [key: ListenerID]: KnownState };
  dependents: RawCoID[];
}

export type ListenerID = number;

type LoadMetadataFromStorageEffect = {
  type: "loadMetadataFromStorage";
  id: RawCoID;
};

type LoadTransactionsFromStorageEffect = {
  type: "loadTransactionsFromStorage";
  id: RawCoID;
  sessionID: SessionID;
  from: number;
  to: number;
};

type SendMessageToPeerEffect = {
  type: "sendMessageToPeer";
  id: RawCoID;
  peerID: PeerID;
  message: SyncMessage;
};

type NotifyListenerEffect = {
  type: "notifyListener";
  listenerID: ListenerID;
};

type WriteToStorageEffect = {
  type: "writeToStorage";
  id: RawCoID;
  header: CoValueHeader | null;
  sessions: { [key: SessionID]: StoredSessionLog };
};

function createEmptyCoValueEntry(id: RawCoID): CoValueEntry {
  return {
    id,
    header: null,
    sessions: {},
    storageState: "unknown",
    peerState: {},
    listeners: {},
    dependents: [],
  };
}

export type LocalNodeState = {
  coValues: { [key: RawCoID]: CoValueEntry };
  peers: PeerID[];
};

export function emptyNode(): LocalNodeState {
  return {
    coValues: {},
    peers: [],
  };
}

export function addPeer(node: LocalNodeState, peerID: PeerID) {
  node.peers.push(peerID);
  for (const coValue of Object.values(node.coValues)) {
    coValue.peerState[peerID] = {
      confirmed: "unknown",
      optimistic: "unknown",
    };
  }
}

export function removePeer(node: LocalNodeState, peerID: PeerID) {
  const index = node.peers.indexOf(peerID);
  if (index === -1) {
    throw new Error("Peer not found");
  }
  node.peers.splice(index, 1);
  for (const coValue of Object.values(node.coValues)) {
    delete coValue.peerState[peerID];
  }
}

export function subscribe(
  node: LocalNodeState,
  id: RawCoID,
): {
  listenerID: ListenerID;
} {
  const existing = node.coValues[id];
  if (!existing) {
    const entry = createEmptyCoValueEntry(id);
    entry.listeners[1] = "unknown";
    node.coValues[id] = entry;
    return { listenerID: 1 };
  } else {
    const nextListenerID = Object.keys(existing.listeners).length + 1;
    existing.listeners[nextListenerID] = "unknown";
    return { listenerID: nextListenerID };
  }
}

export function unsubscribe(
  node: LocalNodeState,
  id: RawCoID,
  listenerID: ListenerID,
) {
  const existing = node.coValues[id];
  if (!existing) {
    throw new Error("CoValue not found");
  }
  delete existing.listeners[listenerID];
}

export function tick(
  node: LocalNodeState,
  crypto: CryptoProvider,
): {
  effects: (
    | NotifyListenerEffect
    | SendMessageToPeerEffect
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
    | WriteToStorageEffect
  )[];
} {
  const effects = [];

  effects.push(...stageLoad(node).effects);
  stageVerify(node, crypto);
  stageValidate(node);
  effects.push(...stageNotify(node).effects);
  effects.push(...stageSync(node).effects);
  effects.push(...stageStore(node).effects);
  return { effects };
}

export function stageLoad(node: LocalNodeState): {
  effects: (
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
  )[];
} {
  const effects: (
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
  )[] = [];
  for (const coValue of Object.values(node.coValues)) {
    if (coValue.storageState === "unknown") {
      effects.push({ type: "loadMetadataFromStorage", id: coValue.id });
      coValue.storageState = "pending";
    } else if (coValue.storageState === "pending") {
      continue;
    } else if (coValue.storageState === "unavailable") {
      continue;
    } else {
      if (
        Object.keys(coValue.listeners).length == 0 &&
        coValue.dependents.length === 0
      )
        continue;
      for (const [sessionID, session] of Object.entries(coValue.sessions) as [
        SessionID,
        SessionEntry,
      ][]) {
        let firstToLoad = -1;
        let lastToLoad = -1;

        for (let i = 0; i < session.transactions.length; i++) {
          if (session.transactions[i]?.state === "availableInStorage") {
            if (firstToLoad === -1) {
              firstToLoad = i;
            }
            lastToLoad = i;
            session.transactions[i] = { state: "loadingFromStorage" };
          }
        }

        if (firstToLoad !== -1) {
          effects.push({
            type: "loadTransactionsFromStorage",
            id: coValue.id,
            sessionID,
            from: firstToLoad,
            to: lastToLoad,
          });
        }
      }
    }
  }
  return { effects };
}

export function stageLoadDeps(node: LocalNodeState) {
  for (const coValue of Object.values(node.coValues)) {
    if (Object.keys(coValue.listeners).length === 0) {
      continue;
    }
    if (coValue.storageState === "pending") {
      continue;
    }
    if (coValue.header?.ruleset.type === "ownedByGroup") {
      const existing = node.coValues[coValue.header.ruleset.group];
      if (existing) {
        if (!existing.dependents.includes(coValue.id)) {
          existing.dependents.push(coValue.id);
        }
      } else {
        const entry = createEmptyCoValueEntry(coValue.header.ruleset.group);
        entry.dependents.push(coValue.id);
        node.coValues[coValue.header.ruleset.group] = entry;
      }
    } else if (coValue.header?.ruleset.type === "group") {
      for (const session of Object.values(coValue.sessions)) {
        for (const tx of session.transactions) {
          if (tx.state === "available" && tx.tx.privacy === "trusting") {
            // TODO: this should read from the tx.decryptionState.changes instead
            const changes = parseJSON(tx.tx.changes);
            for (const change of changes) {
              if (
                typeof change === "object" &&
                change !== null &&
                "op" in change &&
                change.op === "set" &&
                "key" in change
              ) {
                const groupDependency = getGroupDependentKey(change.key);
                if (groupDependency) {
                  const existing = node.coValues[groupDependency];
                  if (existing) {
                    if (!existing.dependents.includes(coValue.id)) {
                      existing.dependents.push(coValue.id);
                    }
                  } else {
                    const entry = createEmptyCoValueEntry(groupDependency);
                    entry.dependents.push(coValue.id);
                    node.coValues[groupDependency] = entry;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export function stageVerify(node: LocalNodeState, crypto: CryptoProvider) {
  for (const coValue of Object.values(node.coValues)) {
    if (
      coValue.storageState === "pending" ||
      coValue.storageState === "unknown" ||
      (Object.keys(coValue.listeners).length === 0 &&
        coValue.dependents.length === 0)
    ) {
      continue;
    }
    for (const session of Object.values(coValue.sessions)) {
      if (session.lastVerified == session.lastAvailable) {
        continue;
      }

      verifySession(node, session, coValue.id, crypto);
    }
  }
}

export function verifySession(
  node: LocalNodeState,
  session: SessionEntry,
  coValueID: RawCoID,
  crypto: CryptoProvider,
) {
  const streamingHash =
    session.streamingHash?.clone() ?? new StreamingHash(crypto);

  for (let i = session.lastVerified + 1; i <= session.lastAvailable; i++) {
    const txState = session.transactions[i];

    if (txState?.state !== "available") {
      throw new Error(
        `Transaction ${i} is not available in ${coValueID} ${session.id}`,
      );
    }

    streamingHash.update(txState.tx);

    if (txState.signature) {
      const hash = streamingHash.digest();
      const authorID = accountOrAgentIDfromSessionID(session.id);
      let signerID: SignerID;
      if (isAgentID(authorID)) {
        signerID = crypto.getAgentSignerID(authorID);
      } else {
        const authorAccount = node.coValues[authorID];
        if (!authorAccount) {
          throw new Error(
            `Author covalue ${authorID} not present, not yet handled`,
          );
        }
        const foundAgentIDs = findAgentIDsInAccount(authorAccount);
        if (foundAgentIDs.length > 1) {
          throw new Error(
            `Multiple agent IDs found in ${authorID} - not yet handled`,
          );
        }
        const onlyAgent = foundAgentIDs[0];
        if (!onlyAgent) {
          throw new Error(`No agent ID found in ${authorID} - not yet handled`);
        }
        signerID = crypto.getAgentSignerID(onlyAgent);
      }
      if (crypto.verify(txState.signature, hash, signerID)) {
        for (let v = session.lastVerified + 1; v <= i; v++) {
          session.transactions[v] = {
            ...(session.transactions[v] as TransactionState & {
              state: "available";
            }),
            state: "verified",
            validity: { type: "unknown" },
            decryptionState: { type: "notDecrypted" },
            stored: false,
          };
        }
        session.lastVerified = i;
      } else {
        console.log(
          `Signature verification failed for transaction ${i} in ${coValueID} ${session.id}`,
        );

        for (
          let iv = session.lastVerified + 1;
          iv <= session.lastAvailable;
          iv++
        ) {
          session.transactions[iv] = {
            ...(session.transactions[iv] as TransactionState & {
              state: "available";
            }),
            state: "verificationFailed",
            reason: `Invalid signature ${iv === i ? "(here)" : `at idx ${i}`}`,
            hash: iv === i ? hash : null,
          };
        }
        session.lastVerified = session.lastAvailable;
        return;
      }
    }
  }
}

export function stageValidate(node: LocalNodeState) {}

export function stageDecrypt(node: LocalNodeState) {}

export function stageNotify(node: LocalNodeState): {
  effects: NotifyListenerEffect[];
} {
  throw new Error("Not implemented");
}

export function stageSync(node: LocalNodeState): {
  effects: SendMessageToPeerEffect[];
} {
  for (const coValue of Object.values(node.coValues)) {
    if (
      coValue.storageState === "pending" ||
      coValue.storageState === "unknown"
    ) {
      continue;
    } else {
      throw new Error("CoValue is not pending or unknown");
    }
  }
  return { effects: [] };
}

export function stageStore(node: LocalNodeState): {
  effects: WriteToStorageEffect[];
} {
  throw new Error("Not implemented");
}

export function onMetadataLoaded(
  node: LocalNodeState,
  id: RawCoID,
  header: CoValueHeader | null,
  knownState: KnownState,
) {
  const entry = node.coValues[id];
  if (!entry) {
    throw new Error("CoValue not found");
  }
  if (header) {
    entry.header = header;
  }
  entry.storageState = knownState;
  if (knownState !== "unknown" && knownState !== "unavailable") {
    for (const sessionID of Object.keys(knownState.sessions) as SessionID[]) {
      let session = entry.sessions[sessionID];
      if (!session) {
        session = {
          id: sessionID,
          transactions: [],
          streamingHash: null,
          lastVerified: -1,
          lastAvailable: -1,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
        };
        entry.sessions[sessionID] = session;
      }
      for (let i = 0; i < (knownState.sessions[sessionID] || 0); i++) {
        if (!session.transactions[i]) {
          session.transactions[i] = { state: "availableInStorage" };
        }
      }
    }
  }
}

export function createCoValue(
  node: LocalNodeState,
  header: CoValueHeader,
): {
  effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
} {
  throw new Error("Not implemented");
}

export function makeTransaction(
  node: LocalNodeState,
  id: RawCoID,
  sessionID: SessionID,
  tx: Transaction,
): {
  result: "success" | "failure";
} {
  throw new Error("Not implemented");
}

export function addTransaction(
  node: LocalNodeState,
  id: RawCoID,
  sessionID: SessionID,
  after: number,
  transactions: Transaction[],
  signature: Signature,
): {
  result: { type: "success" } | { type: "gap"; expectedAfter: number };
} {
  const entry = node.coValues[id];
  if (!entry) {
    throw new Error("CoValue not found");
  }
  const session = entry.sessions[sessionID];
  if (!session) {
    throw new Error("Session not found");
  }
  if (after > session.transactions.length) {
    return {
      result: { type: "gap", expectedAfter: session.transactions.length },
    };
  }
  for (let i = 0; i < transactions.length; i++) {
    const sessionIdx = after + i;
    if (
      session.transactions[sessionIdx] &&
      session.transactions[sessionIdx]!.state !== "availableInStorage"
    ) {
      throw new Error(
        `Unexpected existing state ${session.transactions[sessionIdx]!.state} at index ${sessionIdx}`,
      );
    }
    session.transactions[sessionIdx] = {
      state: "available",
      tx: transactions[i]!,
      signature: i === transactions.length - 1 ? signature : null,
    };
    session.lastAvailable = Math.max(session.lastAvailable, sessionIdx);
  }
  return { result: { type: "success" } };
}

function findAgentIDsInAccount(authorAccount: CoValueEntry): AgentID[] {
  return Object.values(authorAccount.sessions).flatMap((session) =>
    session.transactions.flatMap((tx) => {
      if (tx.state === "verified" && tx.tx.privacy === "trusting") {
        // TODO: this should read from the tx.decryptionState.changes instead
        const changes = parseJSON(tx.tx.changes);
        return changes.flatMap((change) => {
          if (
            typeof change === "object" &&
            change !== null &&
            "op" in change &&
            change.op === "set" &&
            "key" in change &&
            typeof change.key === "string" &&
            isAgentID(change.key)
          ) {
            return [change.key as AgentID];
          } else {
            return [];
          }
        });
      } else {
        return [];
      }
    }),
  );
}
