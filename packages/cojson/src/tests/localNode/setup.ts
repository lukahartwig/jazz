import { Transaction } from "../../coValueCore.js";
import { WasmCrypto } from "../../crypto/WasmCrypto.js";
import { Signature, StreamingHash } from "../../crypto/crypto.js";
import { JsonValue, RawCoID, SessionID, Stringified } from "../../exports.js";

import { LocalNodeState } from "../../localNode/structure.js";

export const crypto = await WasmCrypto.create();

export const coValueID1 = "co_zCoValueID1" as RawCoID;
export const coValueID2 = "co_zCoValueID2" as RawCoID;

export const sessionID1 = "sealer_z1/signer_z1_session1" as SessionID;

export const tx1 = {
  privacy: "trusting",
  changes: '["ch1"]' as Stringified<string[]>,
  madeAt: 1,
} satisfies Transaction;

export const tx2 = {
  privacy: "trusting",
  changes: '["ch2"]' as Stringified<string[]>,
  madeAt: 2,
} satisfies Transaction;

export const tx3 = {
  privacy: "trusting",
  changes: '["ch3"]' as Stringified<string[]>,
  madeAt: 3,
} satisfies Transaction;

export const tx4 = {
  privacy: "trusting",
  changes: '["ch4"]' as Stringified<string[]>,
  madeAt: 4,
} satisfies Transaction;

export const tx5 = {
  privacy: "trusting",
  changes: '["ch5"]' as Stringified<string[]>,
  madeAt: 5,
} satisfies Transaction;

export const streamingHash = new StreamingHash(crypto);
streamingHash.update(tx1);
streamingHash.update(tx2);
export const signatureAfter2 =
  `signature_z[signer_z1/${crypto.shortHash(streamingHash.digest())}]` as Signature;

streamingHash.update(tx3);
streamingHash.update(tx4);
streamingHash.update(tx5);
export const signatureAfter5 =
  `signature_z[signer_z1/${crypto.shortHash(streamingHash.digest())}]` as Signature;

export const scenarios = {
  coValuesWithAvailableInStorageTxs: {
    [coValueID1]: {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        uniqueness: 1,
      },
      sessions: {
        [sessionID1]: {
          transactions: [
            { state: "availableInStorage" as const },
            { state: "availableInStorage" as const },
          ],
          id: sessionID1,
          lastVerified: -1,
          lastAvailable: -1,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: {
        header: true,
        sessions: {
          [sessionID1]: 2,
        },
      },
      peerState: {},
      listeners: {},
      dependents: [],
    },
    [coValueID2]: {
      id: coValueID2,
      header: {
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        uniqueness: 2,
      },
      sessions: {
        [sessionID1]: {
          transactions: [
            { state: "availableInStorage" as const },
            { state: "availableInStorage" as const },
          ],
          id: sessionID1,
          lastVerified: -1,
          lastAvailable: -1,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: {
        header: true,
        sessions: {
          [sessionID1]: 2,
        },
      },
      peerState: {},
      listeners: {},
      dependents: [],
    },
  } satisfies LocalNodeState["coValues"],
  coValue2IsGroupOfCoValue1: {
    [coValueID1]: {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "ownedByGroup", group: coValueID2 },
        meta: null,
        uniqueness: 0,
      },
      sessions: {
        [sessionID1]: {
          id: sessionID1,
          transactions: [
            { state: "available" as const, tx: tx1, signature: null },
            {
              state: "available" as const,
              tx: tx2,
              signature: signatureAfter2,
            },
            { state: "available" as const, tx: tx3, signature: null },
            { state: "available" as const, tx: tx4, signature: null },
            {
              state: "available" as const,
              tx: tx5,
              signature: signatureAfter5,
            },
          ],
          lastVerified: -1,
          lastAvailable: 4,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: { header: true, sessions: { [sessionID1]: 5 } },
      peerState: {},
      listeners: {},
      dependents: [],
    },
    [coValueID2]: {
      id: coValueID2,
      header: null,
      sessions: {},
      storageState: "unknown",
      peerState: {},
      listeners: {},
      dependents: [],
    },
  } satisfies LocalNodeState["coValues"],
  coValue2IsMemberInCoValue1WhichIsAGroup: {
    [coValueID1]: {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "group", initialAdmin: "sealer_z1/signer_z1" },
        meta: null,
        uniqueness: 0,
      },
      sessions: {
        [sessionID1]: {
          id: sessionID1,
          transactions: [
            {
              state: "available" as const,
              tx: {
                privacy: "trusting" as const,
                changes:
                  `[{"op": "set", "key": "${coValueID2}", "value": "someValue"}]` as Stringified<
                    string[]
                  >,
                madeAt: 1,
              },
              signature: null,
            },
            {
              state: "available" as const,
              tx: tx2,
              signature: "signature_after2" as Signature,
            },
            { state: "available" as const, tx: tx3, signature: null },
            { state: "available" as const, tx: tx4, signature: null },
            {
              state: "available" as const,
              tx: tx5,
              signature: "signature_after5" as Signature,
            },
          ],
          lastVerified: -1,
          lastAvailable: 4,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: { header: true, sessions: { [sessionID1]: 5 } },
      peerState: {},
      listeners: {},
      dependents: [],
    },
    [coValueID2]: {
      id: coValueID2,
      header: null,
      sessions: {},
      storageState: "unknown",
      peerState: {},
      listeners: {},
      dependents: [],
    },
  } satisfies LocalNodeState["coValues"],
  coValue2IsExtendedGroupOfCoValue1: {
    [coValueID1]: {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "group", initialAdmin: "sealer_z1/signer_z1" },
        meta: null,
        uniqueness: 0,
      },
      sessions: {
        [sessionID1]: {
          id: sessionID1,
          transactions: [
            {
              state: "available" as const,
              tx: {
                privacy: "trusting" as const,
                changes:
                  `[{"op": "set", "key": "parent_${coValueID2}", "value": "someValue"}]` as Stringified<
                    string[]
                  >,
                madeAt: 1,
              },
              signature: null,
            },
            {
              state: "available" as const,
              tx: tx2,
              signature: "signature_after2" as Signature,
            },
            { state: "available" as const, tx: tx3, signature: null },
            { state: "available" as const, tx: tx4, signature: null },
            {
              state: "available" as const,
              tx: tx5,
              signature: "signature_after5" as Signature,
            },
          ],
          lastVerified: -1,
          lastAvailable: 4,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: { header: true, sessions: { [sessionID1]: 5 } },
      peerState: {},
      listeners: {},
      dependents: [],
    },
    [coValueID2]: {
      id: coValueID2,
      header: null,
      sessions: {},
      storageState: "unknown",
      peerState: {},
      listeners: {},
      dependents: [],
    },
  } satisfies LocalNodeState["coValues"],
  coValue2IsAccountOwnerOfCoValue1: {
    [coValueID1]: {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "ownedByGroup", group: coValueID2 },
        meta: null,
        uniqueness: 0,
      },
      sessions: {
        [`${coValueID2}_session1` as SessionID]: {
          id: `${coValueID2}_session1` as SessionID,
          transactions: [
            { state: "available" as const, tx: tx1, signature: null },
            {
              state: "available" as const,
              tx: tx2,
              signature: signatureAfter2,
            },
            { state: "available" as const, tx: tx3, signature: null },
            { state: "available" as const, tx: tx4, signature: null },
            {
              state: "available" as const,
              tx: tx5,
              signature: signatureAfter5,
            },
          ],
          lastVerified: -1,
          lastAvailable: 4,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
          streamingHash: null,
        },
      },
      storageState: { header: true, sessions: { [sessionID1]: 5 } },
      peerState: {},
      listeners: {},
      dependents: [],
    },
    [coValueID2]: {
      id: coValueID2,
      header: {
        type: "comap",
        ruleset: { type: "group", initialAdmin: "sealer_z1/signer_z1" },
        meta: null,
        uniqueness: 0,
      },
      sessions: {
        ["sealer_z1/signer_z1_session_zInit"]: {
          id: "sealer_z1/signer_z1_session_zInit" as const,
          transactions: [
            {
              state: "verified" as const,
              tx: {
                privacy: "trusting" as const,
                changes:
                  '[{ "op": "set", "key": "sealer_z1/signer_z1", "value": "admin"}]' as Stringified<
                    JsonValue[]
                  >,
                madeAt: 1,
              },
              validity: { type: "valid" },
              decryptionState: {
                type: "decrypted",
                changes: [
                  { op: "set", key: "sealer_z1/signer_z1", value: "admin" },
                ],
              },
              stored: true,
              signature: "signature_zSomeValidSignature",
            },
          ],
          lastVerified: 0,
          lastAvailable: 0,
          lastDepsAvailable: 0,
          lastDecrypted: 0,
          streamingHash: null,
        },
      },
      storageState: "unknown",
      peerState: {},
      listeners: {},
      dependents: [],
    },
  } satisfies LocalNodeState["coValues"],
};
