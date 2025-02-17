import { describe, expect, test } from "vitest";
import { CoValueHeader, Transaction } from "../coValueCore.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { Signature } from "../crypto/crypto.js";
import { RawCoID, SessionID, Stringified } from "../exports.js";
import { LocalNode2, SessionEntry, TransactionState } from "../localNode2.js";
import { PeerID } from "../sync.js";

const crypto = await WasmCrypto.create();

describe("Subscribing to a CoValue", () => {
  test("creates an empty entry if none exists yet", () => {
    const node = new LocalNode2(crypto.newRandomAgentSecret());
    const id = "co_fakeCoValueID" as RawCoID;
    const { listenerID } = node.subscribe(id);

    expect(listenerID).toBeDefined();

    expect(node.coValues[id]).toEqual({
      id,
      header: null,
      sessions: {},
      storageState: "unknown",
      peerState: {},
      listeners: { [listenerID]: "unknown" },
    });
  });

  test("adds a listener if an entry already exists", () => {
    const node = new LocalNode2(crypto.newRandomAgentSecret());
    const id = "co_fakeCoValueID" as RawCoID;
    const { listenerID: firstListenerID } = node.subscribe(id);
    const { listenerID: secondListenerID } = node.subscribe(id);

    expect(firstListenerID).toBeDefined();
    expect(secondListenerID).toBeDefined();
    expect(firstListenerID).not.toEqual(secondListenerID);

    expect(node.coValues[id]).toEqual({
      id,
      header: null,
      sessions: {},
      storageState: "unknown",
      peerState: {},
      listeners: {
        [firstListenerID]: "unknown",
        [secondListenerID]: "unknown",
      },
    });
  });

  test("unsubscribing from a CoValue removes the listener", () => {
    const node = new LocalNode2(crypto.newRandomAgentSecret());
    const id = "co_fakeCoValueID" as RawCoID;

    const { listenerID } = node.subscribe(id);
    expect(node.coValues[id].listeners[listenerID]).toBe("unknown");

    node.unsubscribe(id, listenerID);
    expect(node.coValues[id].listeners[listenerID]).toBeUndefined();
  });
});

describe("Modifying peers", () => {
  const node = new LocalNode2(crypto.newRandomAgentSecret());
  const coValueID1 = "co_fakeCoValueID1" as RawCoID;
  const coValueID2 = "co_fakeCoValueID2" as RawCoID;
  const _1 = node.subscribe(coValueID1);
  const _2 = node.subscribe(coValueID2);

  test("Adding a peer adds it to the node and to every CoValue with an unknown peer state", () => {
    const peerID = "peer1" as PeerID;
    node.addPeer(peerID);
    expect(node.peers).toEqual([peerID]);
    expect(node.coValues[coValueID1].peerState[peerID]).toEqual({
      confirmed: "unknown",
      optimistic: "unknown",
    });
    expect(node.coValues[coValueID2].peerState[peerID]).toEqual({
      confirmed: "unknown",
      optimistic: "unknown",
    });
  });

  test("Removing a peer removes it from the node and from every CoValue", () => {
    const peerID = "peer1" as PeerID;
    node.removePeer(peerID);
    expect(node.peers).toEqual([]);
    expect(node.coValues[coValueID1].peerState[peerID]).toBeUndefined();
    expect(node.coValues[coValueID2].peerState[peerID]).toBeUndefined();
  });
});

describe("Loading from storage", () => {
  function setupNodeWithTwoCoValues() {
    const node = new LocalNode2(crypto.newRandomAgentSecret());
    const coValueID1 = "co_fakeCoValueID1" as RawCoID;
    const coValueID2 = "co_fakeCoValueID2" as RawCoID;
    const _1 = node.subscribe(coValueID1);
    const _2 = node.subscribe(coValueID2);
    return { node, coValueID1, coValueID2 };
  }

  test("stageLoad puts covalues of unknown storage state into pending and issues load effects", () => {
    const { node, coValueID1, coValueID2 } = setupNodeWithTwoCoValues();
    const { effects } = node.stageLoad();
    expect(effects).toEqual([
      { type: "loadMetadataFromStorage", id: coValueID1 },
      { type: "loadMetadataFromStorage", id: coValueID2 },
    ]);

    expect(node.coValues[coValueID1].storageState).toBe("pending");
    expect(node.coValues[coValueID2].storageState).toBe("pending");
  });

  test("when we receive metadata of a present CoValue from storage, we keep it in memory, update the storage state and add pending transactions", () => {
    const { node, coValueID1 } = setupNodeWithTwoCoValues();
    const header = {
      type: "comap",
      ruleset: { type: "unsafeAllowAll" },
      meta: null,
      uniqueness: 0,
    } satisfies CoValueHeader;

    const knownState = {
      header: true,
      sessions: {
        session1: 5,
      },
    };

    node.onMetadataLoaded(coValueID1, header, knownState);

    const entry = node.coValues[coValueID1];

    expect(entry?.header).toEqual(header);
    expect(entry?.storageState).toBe(knownState);
    expect(entry?.sessions["session1"]?.transactions).toEqual([
      { state: "availableInStorage" },
      { state: "availableInStorage" },
      { state: "availableInStorage" },
      { state: "availableInStorage" },
      { state: "availableInStorage" },
    ]);
  });

  test("when we receive information that a CoValue is unavailable in storage, we update the storage state accordingly", () => {
    const { node, coValueID1 } = setupNodeWithTwoCoValues();
    const knownState = "unavailable" as const;

    node.onMetadataLoaded(coValueID1, null, knownState);

    expect(node.coValues[coValueID1].storageState).toBe("unavailable");
  });

  test("stageLoad requests transactions from storage if a CoValue has listeners", () => {
    const node = new LocalNode2(crypto.newRandomAgentSecret());
    const coValueID1 = "co_fakeCoValueID1" as RawCoID;
    const coValueID2 = "co_fakeCoValueID2" as RawCoID;

    node.coValues[coValueID1] = {
      id: coValueID1,
      header: {
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        uniqueness: 1,
      },
      sessions: {
        ["session1" as SessionID]: {
          transactions: [
            { state: "availableInStorage" as const },
            { state: "availableInStorage" as const },
          ],
          id: "session1" as SessionID,
          lastVerified: 0,
          lastAvailable: 0,
          lastDepsAvailable: 0,
          lastDecrypted: 0,
        },
      },
      storageState: {
        header: true,
        sessions: {
          ["session1" as SessionID]: 2,
        },
      },
      peerState: {},
      listeners: {
        [1]: "unknown",
      },
    };

    node.coValues[coValueID2] = {
      id: coValueID2,
      header: {
        type: "comap",
        ruleset: { type: "unsafeAllowAll" },
        meta: null,
        uniqueness: 2,
      },
      sessions: {
        ["session1" as SessionID]: {
          transactions: [
            { state: "availableInStorage" as const },
            { state: "availableInStorage" as const },
          ],
          id: "session1" as SessionID,
          lastVerified: 0,
          lastAvailable: 0,
          lastDepsAvailable: 0,
          lastDecrypted: 0,
        },
      },
      storageState: {
        header: true,
        sessions: {
          ["session1" as SessionID]: 2,
        },
      },
      peerState: {},
      listeners: {},
    };

    const { effects } = node.stageLoad();
    expect(effects).toEqual([
      {
        type: "loadTransactionsFromStorage",
        id: coValueID1,
        sessionID: "session1" as SessionID,
        from: 0,
        to: 1,
      },
    ]);

    expect(
      node.coValues[coValueID1].sessions["session1"]?.transactions,
    ).toEqual([
      { state: "loadingFromStorage" },
      { state: "loadingFromStorage" },
    ]);

    expect(
      node.coValues[coValueID2].sessions["session1"]?.transactions,
    ).toEqual([
      { state: "availableInStorage" },
      { state: "availableInStorage" },
    ]);
  });

  test.todo(
    "stageLoad requests transactions from storage that need to be synced",
  );

  test("Transactions added from storage are added to memory", () => {
    const { node, coValueID1 } = setupNodeWithTwoCoValues();
    const header = {
      type: "comap",
      ruleset: { type: "unsafeAllowAll" },
      meta: null,
      uniqueness: 0,
    } satisfies CoValueHeader;

    const knownState = {
      header: true,
      sessions: {
        session1: 5,
      },
    };

    node.onMetadataLoaded(coValueID1, header, knownState);

    const tx1 = {
      privacy: "trusting",
      changes: '["ch1"]' as Stringified<string[]>,
      madeAt: 1,
    } satisfies Transaction;

    const tx2 = {
      privacy: "trusting",
      changes: '["ch2"]' as Stringified<string[]>,
      madeAt: 2,
    } satisfies Transaction;

    const tx3 = {
      privacy: "trusting",
      changes: '["ch3"]' as Stringified<string[]>,
      madeAt: 3,
    } satisfies Transaction;

    const tx4 = {
      privacy: "trusting",
      changes: '["ch4"]' as Stringified<string[]>,
      madeAt: 4,
    } satisfies Transaction;

    const tx5 = {
      privacy: "trusting",
      changes: '["ch5"]' as Stringified<string[]>,
      madeAt: 5,
    } satisfies Transaction;

    const { result: result1 } = node.addTransaction(
      coValueID1,
      "session1" as SessionID,
      0,
      [tx1, tx2],
      "signature_after2" as Signature,
    );

    expect(result1).toEqual({ type: "success" });
    expect(node.coValues[coValueID1].sessions["session1"]).toEqual({
      id: "session1" as SessionID,
      lastAvailable: 1,
      lastDepsAvailable: 0,
      lastVerified: 0,
      lastDecrypted: 0,
      transactions: [
        { state: "available", tx: tx1, signature: null },
        {
          state: "available",
          tx: tx2,
          signature: "signature_after2" as Signature,
        },
        { state: "availableInStorage" },
        { state: "availableInStorage" },
        { state: "availableInStorage" },
      ],
    } satisfies SessionEntry);

    const { result: result2 } = node.addTransaction(
      coValueID1,
      "session1" as SessionID,
      2,
      [tx3, tx4, tx5],
      "signature_after5" as Signature,
    );

    expect(result2).toEqual({ type: "success" });
    expect(node.coValues[coValueID1].sessions["session1"]).toEqual({
      id: "session1" as SessionID,
      lastAvailable: 4,
      lastDepsAvailable: 0,
      lastVerified: 0,
      lastDecrypted: 0,
      transactions: [
        { state: "available", tx: tx1, signature: null },
        {
          state: "available",
          tx: tx2,
          signature: "signature_after2" as Signature,
        },
        { state: "available", tx: tx3, signature: null },
        { state: "available", tx: tx4, signature: null },
        {
          state: "available",
          tx: tx5,
          signature: "signature_after5" as Signature,
        },
      ],
    } satisfies SessionEntry);

    // console.dir(node, { depth: null });
  });
});

describe("Syncing", () => {
  const node = new LocalNode2(crypto.newRandomAgentSecret());
  const coValueID1 = "co_fakeCoValueID1" as RawCoID;
  const coValueID2 = "co_fakeCoValueID2" as RawCoID;
  const _1 = node.subscribe(coValueID1);

  node.stageLoad();

  const _2 = node.subscribe(coValueID2);

  test("stageSync doesn't do anything and causes no effects on CoValues with storage state unknown or pending", () => {
    const coValuesBefore = structuredClone(node.coValues);
    const { effects } = node.stageSync();
    expect(effects).toEqual([]);
    expect(node.coValues).toEqual(coValuesBefore);
  });
});
