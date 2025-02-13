import { CoValueHeader, Transaction } from "./coValueCore.js";
import { Signature } from "./crypto/crypto.js";
import { CoValueCore, RawCoID, SessionID } from "./exports.js";
import { KnownStateMessage } from "./sync.js";

type StoredSessionLog = {
  transactions: Transaction[];
  signatureAfter: { [txIdx: number]: Signature | undefined };
  lastSignature: Signature;
};

export interface StorageAdapter {
  get(id: RawCoID): Promise<{
    header: CoValueHeader;
    sessions: Map<SessionID, StoredSessionLog>;
  } | null>;

  writeHeader(id: RawCoID, header: CoValueHeader): Promise<void>;

  appendToSession(
    id: RawCoID,
    sessionID: SessionID,
    afterIdx: number,
    tx: Transaction[],
    lastSignature: Signature,
  ): Promise<void>;
}

export class StorageDriver {
  private storageAdapter: StorageAdapter;
  private storedStates: Map<RawCoID, KnownStateMessage> = new Map();

  constructor(storageAdapter: StorageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  get(id: RawCoID): Promise<{
    header: CoValueHeader;
    sessions: Map<SessionID, StoredSessionLog>;
  } | null> {
    this.storageAdapter.get(id);
  }

  set(core: CoValueCore): Promise<void> {
    // diff
  }
}
