import { CoValueHeader, Transaction } from "./coValueCore.js";
import { Signature, StreamingHash } from "./crypto/crypto.js";
import {
  AgentSecret,
  JsonValue,
  Peer,
  RawCoID,
  SessionID,
  SyncMessage,
} from "./exports.js";
import { StoredSessionLog } from "./storage.js";
import { PeerID } from "./sync.js";

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
    };

export type SessionEntry = {
  id: SessionID;
  transactions: TransactionState[];
  lastAvailable: number;
  lastDepsAvailable: number;
  lastVerified: number;
  lastDecrypted: number;
};

type KnownState =
  | {
      header: boolean;
      sessions: Map<SessionID, number>;
    }
  | "unknown"
  | "unavailable";

interface CoValueEntry {
  id: RawCoID;
  header: CoValueHeader | null;
  sessions: Map<SessionID, SessionEntry>;
  storageState: KnownState | "pending";
  peerState: Map<
    PeerID,
    { confirmed: KnownState | "pending"; optimistic: KnownState }
  >;
  listeners: Map<ListenerID, KnownState>;
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
  sessions: Map<SessionID, StoredSessionLog>;
};

export class LocalNode2 {
  coValues: Map<RawCoID, CoValueEntry>;
  agentSecret: AgentSecret;
  peers: Set<PeerID>;

  constructor(agentSecret: AgentSecret) {
    this.agentSecret = agentSecret;
    this.coValues = new Map();
    this.peers = new Set();
  }

  addPeer(peerID: PeerID) {
    this.peers.add(peerID);
    for (const coValue of this.coValues.values()) {
      coValue.peerState.set(peerID, {
        confirmed: "unknown",
        optimistic: "unknown",
      });
    }
  }

  removePeer(peerID: PeerID) {
    this.peers.delete(peerID);
    for (const coValue of this.coValues.values()) {
      coValue.peerState.delete(peerID);
    }
  }

  subscribe(id: RawCoID): {
    listenerID: ListenerID;
  } {
    const existing = this.coValues.get(id);
    if (!existing) {
      this.coValues.set(id, {
        id,
        header: null,
        sessions: new Map(),
        storageState: "unknown",
        peerState: new Map(),
        listeners: new Map([[1, "unknown"]]),
      });

      return { listenerID: 1 };
    } else {
      const nextListenerID = existing.listeners.size + 1;
      existing.listeners.set(nextListenerID, "unknown");
      return { listenerID: nextListenerID };
    }
  }

  unsubscribe(id: RawCoID, listenerID: ListenerID) {
    const existing = this.coValues.get(id);
    if (!existing) {
      throw new Error("CoValue not found");
    }
    existing.listeners.delete(listenerID);
  }

  tick(): {
    effects: (
      | NotifyListenerEffect
      | SendMessageToPeerEffect
      | LoadMetadataFromStorageEffect
      | LoadTransactionsFromStorageEffect
      | WriteToStorageEffect
    )[];
  } {
    const effects = [];

    effects.push(...this.stageLoad().effects);
    this.stageVerify();
    this.stageValidate();
    effects.push(...this.stageNotify().effects);
    effects.push(...this.stageSync().effects);
    effects.push(...this.stageStore().effects);
    return { effects };
  }

  stageLoad(): {
    effects: (
      | LoadMetadataFromStorageEffect
      | LoadTransactionsFromStorageEffect
    )[];
  } {
    const effects: (
      | LoadMetadataFromStorageEffect
      | LoadTransactionsFromStorageEffect
    )[] = [];
    for (const coValue of this.coValues.values()) {
      if (coValue.storageState === "unknown") {
        effects.push({ type: "loadMetadataFromStorage", id: coValue.id });
        coValue.storageState = "pending";
      } else if (coValue.storageState === "pending") {
        continue;
      } else if (coValue.storageState === "unavailable") {
        continue;
      } else {
        if (coValue.listeners.size > 0) {
          for (const [sessionID, session] of coValue.sessions.entries()) {
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
    }
    return { effects };
  }

  stageLoadDeps(coValue: CoValueEntry): {
    effects: LoadMetadataFromStorageEffect[];
  } {
    throw new Error("Not implemented");
  }

  stageVerify() {}

  stageValidate() {}

  stageNotify(): { effects: NotifyListenerEffect[] } {
    throw new Error("Not implemented");
  }

  stageSync(): { effects: SendMessageToPeerEffect[] } {
    for (const coValue of this.coValues.values()) {
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

  stageStore(): { effects: WriteToStorageEffect[] } {
    throw new Error("Not implemented");
  }

  onMetadataLoaded(
    id: RawCoID,
    header: CoValueHeader | null,
    knownState: KnownState,
  ) {
    const entry = this.coValues.get(id);
    if (!entry) {
      throw new Error("CoValue not found");
    }
    if (header) {
      entry.header = header;
    }
    entry.storageState = knownState;
    if (knownState !== "unknown" && knownState !== "unavailable") {
      for (const sessionID of knownState.sessions.keys()) {
        let session = entry.sessions.get(sessionID);
        if (!session) {
          session = {
            id: sessionID,
            transactions: [],
            lastVerified: 0,
            lastAvailable: 0,
            lastDepsAvailable: 0,
            lastDecrypted: 0,
          };
          entry.sessions.set(sessionID, session);
        }
        for (let i = 0; i < (knownState.sessions.get(sessionID) || 0); i++) {
          if (!session.transactions[i]) {
            session.transactions[i] = { state: "availableInStorage" };
          }
        }
      }
    }
  }

  createCoValue(header: CoValueHeader): {
    effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
  } {
    throw new Error("Not implemented");
  }

  makeTransaction(
    id: RawCoID,
    sessionID: SessionID,
    tx: Transaction,
  ): {
    result: "success" | "failure";
  } {
    throw new Error("Not implemented");
  }

  addTransaction(
    id: RawCoID,
    sessionID: SessionID,
    after: number,
    transactions: Transaction[],
    signature: Signature,
  ): {
    result: { type: "success" } | { type: "gap"; expectedAfter: number };
  } {
    const entry = this.coValues.get(id);
    if (!entry) {
      throw new Error("CoValue not found");
    }
    const session = entry.sessions.get(sessionID);
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
}
