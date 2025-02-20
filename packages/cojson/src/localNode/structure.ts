import { CoValueHeader, Transaction } from "../coValueCore.js";
import { Hash, Signature, StreamingHash } from "../crypto/crypto.js";
import { RawCoID, SessionID } from "../exports.js";
import { JsonValue } from "../jsonValue.js";
import { PeerID } from "../sync.js";

export type LocalNodeState = {
  coValues: { [key: RawCoID]: CoValueState };
  peers: PeerID[];
};

export interface CoValueState {
  id: RawCoID;
  header: CoValueHeader | null;
  sessions: { [key: SessionID]: SessionState };
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

export type KnownState =
  | {
      header: boolean;
      sessions: { [key: SessionID]: number };
    }
  | "unknown"
  | "unavailable";

export type SessionState = {
  id: SessionID;
  transactions: TransactionState[];
  streamingHash: StreamingHash | null;
  lastAvailable: number;
  lastDepsAvailable: number;
  lastVerified: number;
  lastDecrypted: number;
};

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

export function emptyNode(): LocalNodeState {
  return {
    coValues: {},
    peers: [],
  };
}

export function emptyCoValueState(id: RawCoID): CoValueState {
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
