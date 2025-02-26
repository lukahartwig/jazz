import {
  Encrypted,
  Hash,
  KeyID,
  Signature,
  StreamingHash,
} from "../crypto/crypto.js";
import { AnyRawCoValue, RawCoID, SessionID, Stringified } from "../exports.js";
import { TransactionID } from "../ids.js";
import { JsonObject, JsonValue } from "../jsonValue.js";
import { PermissionsDef } from "../permissions.js";
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

export type CoValueHeader = {
  type: AnyRawCoValue["type"];
  ruleset: PermissionsDef;
  meta: JsonObject | null;
} & CoValueUniqueness;

export type CoValueUniqueness = {
  uniqueness: JsonValue;
  createdAt?: `2${string}` | null;
};

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

export type PrivateTransaction = {
  privacy: "private";
  madeAt: number;
  keyUsed: KeyID;
  encryptedChanges: Encrypted<JsonValue[], { in: RawCoID; tx: TransactionID }>;
};

export type TrustingTransaction = {
  privacy: "trusting";
  madeAt: number;
  changes: Stringified<JsonValue[]>;
};

export type Transaction = PrivateTransaction | TrustingTransaction;

export type DecryptedTransaction = {
  txID: TransactionID;
  changes: JsonValue[];
  madeAt: number;
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
