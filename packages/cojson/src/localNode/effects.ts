import { RawCoID, SessionID, SyncMessage } from "../exports.js";
import { StoredSessionLog } from "../storage.js";
import { PeerID } from "../sync.js";
import { CoValueHeader, ListenerID } from "./structure.js";

export type LoadMetadataFromStorageEffect = {
  type: "loadMetadataFromStorage";
  id: RawCoID;
};

export type LoadTransactionsFromStorageEffect = {
  type: "loadTransactionsFromStorage";
  id: RawCoID;
  sessionID: SessionID;
  from: number;
  to: number;
};

export type SendMessageToPeerEffect = {
  type: "sendMessageToPeer";
  id: RawCoID;
  peerID: PeerID;
  message: SyncMessage;
};

export type NotifyListenerEffect = {
  type: "notifyListener";
  listenerID: ListenerID;
};

export type WriteToStorageEffect = {
  type: "writeToStorage";
  id: RawCoID;
  header: CoValueHeader | null;
  sessions: { [key: SessionID]: StoredSessionLog };
};
