import { CoValueHeader, Transaction } from "./coValueCore.js";
import { Signature } from "./crypto/crypto.js";
import {
  AgentSecret,
  Peer,
  RawCoID,
  SessionID,
  SyncMessage,
} from "./exports.js";
import { PeerID } from "./sync.js";

type TransactionState =
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
        | { type: "valid" }
        | { type: "invalid"; reason: string }
        | { type: "pending"; awaitingDependencies: RawCoID[] };
      stored: boolean;
    };

type SessionEntry = {
  id: SessionID;
  transactions: TransactionState[];
  lastVerified: number;
};

type KnownState =
  | {
      header: boolean;
      sessions: Map<SessionID, number>;
    }
  | "unknown"
  | "unavailable";

class CoValueEntry {
  id: RawCoID;
  header: CoValueHeader | null;
  headerStored: boolean;
  sessions: Map<SessionID, SessionEntry>;
  storageState: KnownState;
  peerState: Map<PeerID, KnownState>;
}

export type ListenerID = number;

type LoadFromStorageEffect = {
  type: "loadFromStorage";
  id: RawCoID;
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
  private coValues: Map<RawCoID, CoValueEntry>;
  private agentSecret: AgentSecret;
  peers: Set<PeerID>;

  constructor(agentSecret: AgentSecret) {
    this.agentSecret = agentSecret;
    this.coValues = new Map();
    this.peers = new Map();
  }

  addPeer(peerID: PeerID) {}

  removePeer(peerID: PeerID) {}

  subscribe(id: RawCoID): {
    listenerID: ListenerID;
  } {}

  unsubscribe(listenerID: ListenerID) {}

  tick(): {
    effects: (
      | NotifyListenerEffect
      | SendMessageToPeerEffect
      | LoadFromStorageEffect
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

  stageLoad(): { effects: LoadFromStorageEffect[] } {}

  stageVerify() {}

  stageValidate() {}

  stageNotify(): { effects: NotifyListenerEffect[] } {}

  stageSync(): { effects: SendMessageToPeerEffect[] } {}

  stageStore(): { effects: WriteToStorageEffect[] } {}

  onHeaderReceived(
    id: RawCoID,
    header: CoValueHeader,
    isFromStorage: boolean,
  ) {}

  createCoValue(header: CoValueHeader): {
    effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
  } {}

  makeTransaction(
    id: RawCoID,
    sessionID: SessionID,
    tx: Transaction,
  ): {
    result: "success" | "failure";
    effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
  } {}

  tryAddTransaction(
    id: RawCoID,
    sessionID: SessionID,
    tx: Transaction,
  ): {
    result: "success" | "failure";
    effects: (WriteToStorageEffect | SendMessageToPeerEffect)[];
  } {}
}
