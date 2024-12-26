import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";
import type { AnyRawCoValue, CoID } from "./coValue.js";
import { type RawCoValue } from "./coValue.js";
import {
  CoValueCore,
  type CoValueUniqueness,
  MAX_RECOMMENDED_TX_SIZE,
  idforHeader,
} from "./coValueCore.js";
import type {
  AccountMeta,
  RawAccountID,
  RawAccountMigration,
} from "./coValues/account.js";
import {
  ControlledAgent,
  RawAccount,
  RawControlledAccount,
  RawProfile,
  accountHeaderForInitialAgentSecret,
} from "./coValues/account.js";
import { RawCoList } from "./coValues/coList.js";
import { RawCoMap } from "./coValues/coMap.js";
import type {
  BinaryCoStreamMeta,
  BinaryStreamInfo,
} from "./coValues/coStream.js";
import { RawBinaryCoStream, RawCoStream } from "./coValues/coStream.js";
import type { Everyone, InviteSecret } from "./coValues/group.js";
import { EVERYONE, RawGroup } from "./coValues/group.js";
import type { AgentSecret } from "./crypto/crypto.js";
import {
  CryptoProvider,
  StreamingHash,
  secretSeedLength,
  shortHashLength,
} from "./crypto/crypto.js";
import type { AgentID, SessionID } from "./ids.js";
import {
  getGroupDependentKey,
  getGroupDependentKeyList,
  isRawCoID,
  rawCoIDfromBytes,
  rawCoIDtoBytes,
} from "./ids.js";
import { Stringified, parseJSON } from "./jsonStringify.js";
import type { JsonValue } from "./jsonValue.js";
import {
  IncomingSyncStream,
  LocalNode,
  OutgoingSyncQueue,
} from "./localNode.js";
import type * as Media from "./media.js";
import type { Peer } from "./peer/PeerEntry.js";
import { emptyDataMessage, unknownDataMessage } from "./peer/PeerOperations.js";
import type { Role } from "./permissions.js";
import { getPriorityFromHeader } from "./priority.js";
import { FileSystem } from "./storage/FileSystem.js";
import { BlockFilename, LSMStorage, WalFilename } from "./storage/index.js";
import { Channel, connectedPeers } from "./streamUtils.js";
import { DisconnectedError, PingTimeoutError } from "./sync.js";
import type { SyncMessage } from "./sync/index.js";
import { emptyKnownState } from "./sync/index.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";

type Value = JsonValue | AnyRawCoValue;

/** @hidden */
export const cojsonInternals = {
  connectedPeers,
  rawCoIDtoBytes,
  rawCoIDfromBytes,
  secretSeedLength,
  shortHashLength,
  expectGroup,
  base64URLtoBytes,
  bytesToBase64url,
  parseJSON,
  accountOrAgentIDfromSessionID,
  isAccountID,
  accountHeaderForInitialAgentSecret,
  idforHeader,
  StreamingHash,
  Channel,
  getPriorityFromHeader,
  getGroupDependentKeyList,
  getGroupDependentKey,
};

export {
  LocalNode,
  RawGroup,
  Role,
  EVERYONE,
  Everyone,
  RawCoMap,
  RawCoList,
  RawCoStream,
  RawBinaryCoStream,
  RawCoValue,
  CoID,
  AnyRawCoValue,
  RawAccount,
  RawAccountID,
  AccountMeta,
  RawAccountMigration,
  RawProfile as Profile,
  SessionID,
  Media,
  CoValueCore,
  ControlledAgent,
  RawControlledAccount,
  MAX_RECOMMENDED_TX_SIZE,
  JsonValue,
  Peer,
  BinaryStreamInfo,
  BinaryCoStreamMeta,
  AgentID,
  AgentSecret,
  InviteSecret,
  CryptoProvider,
  SyncMessage,
  isRawCoID,
  LSMStorage,
  emptyKnownState,
  emptyDataMessage,
  unknownDataMessage,
};

export type {
  Value,
  FileSystem,
  BlockFilename,
  WalFilename,
  IncomingSyncStream,
  OutgoingSyncQueue,
  DisconnectedError,
  PingTimeoutError,
  CoValueUniqueness,
  Stringified,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CojsonInternalTypes {
  export type KnownStateMessage = import("./sync/index.js").KnownStateMessage;
  export type CoValueKnownState = import("./sync/index.js").CoValueKnownState;
  export type CoValueContent = import("./sync/index.js").CoValueContent;
  export type NewContentMessage = import("./sync/index.js").NewContentMessage;
  export type PullMessage = import("./sync/index.js").PullMessage;
  export type PushMessage = import("./sync/index.js").PushMessage;
  export type DataMessage = import("./sync/index.js").DataMessage;
  export type AckMessage = import("./sync/index.js").AckMessage;
  export type SessionNewContent = import("./coValueCore.js").SessionNewContent;
  export type CoValueHeader = import("./coValueCore.js").CoValueHeader;
  export type Transaction = import("./coValueCore.js").Transaction;
  export type TransactionID = import("./ids.js").TransactionID;
  export type Signature = import("./crypto/crypto.js").Signature;
  export type RawCoID = import("./ids.js").RawCoID;
  export type ProfileShape = import("./coValues/account.js").ProfileShape;
  export type SealerSecret = import("./crypto/crypto.js").SealerSecret;
  export type SignerSecret = import("./crypto/crypto.js").SignerSecret;
  export type JsonObject = import("./jsonValue.js").JsonObject;
}
