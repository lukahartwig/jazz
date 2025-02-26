import { describe, expect, test } from "vitest";
import { Signature } from "../../crypto/crypto.js";
import { subscribe } from "../../localNode/actions/subscribing.js";
import { addTransaction } from "../../localNode/handlers/addTransaction.js";
import { onMetadataLoaded } from "../../localNode/handlers/onMetadataLoaded.js";
import { stageLoad } from "../../localNode/stages/0_load.js";
import {
  CoValueHeader,
  SessionState,
  emptyNode,
} from "../../localNode/structure.js";
import {
  coValueID1,
  coValueID2,
  scenarios,
  sessionID1,
  tx1,
  tx2,
  tx3,
  tx4,
  tx5,
} from "./setup.js";

describe("Loading from storage", () => {
  function setupNodeWithTwoCoValues() {
    const node = emptyNode();

    const _1 = subscribe(node, coValueID1);
    const _2 = subscribe(node, coValueID2);
    return { node, coValueID1, coValueID2 };
  }

  test("stageLoad puts covalues of unknown storage state into pending and issues load effects", () => {
    const { node, coValueID1, coValueID2 } = setupNodeWithTwoCoValues();
    const { effects } = stageLoad(node);
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
        [sessionID1]: 5,
      },
    };

    onMetadataLoaded(node, coValueID1, header, knownState);

    const entry = node.coValues[coValueID1];

    expect(entry?.header).toEqual(header);
    expect(entry?.storageState).toBe(knownState);
    expect(entry?.sessions[sessionID1]?.transactions).toEqual([
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

    onMetadataLoaded(node, coValueID1, null, knownState);

    expect(node.coValues[coValueID1].storageState).toBe("unavailable");
  });

  test("stageLoad requests transactions from storage if a CoValue has listeners", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValuesWithAvailableInStorageTxs,
    );

    const _ = subscribe(node, coValueID1);

    const { effects } = stageLoad(node);
    expect(effects).toEqual([
      {
        type: "loadTransactionsFromStorage",
        id: coValueID1,
        sessionID: sessionID1,
        from: 0,
        to: 1,
      },
    ]);

    expect(
      node.coValues[coValueID1].sessions[sessionID1]?.transactions,
    ).toEqual([
      { state: "loadingFromStorage" },
      { state: "loadingFromStorage" },
    ]);

    expect(
      node.coValues[coValueID2].sessions[sessionID1]?.transactions,
    ).toEqual([
      { state: "availableInStorage" },
      { state: "availableInStorage" },
    ]);
  });

  test("stageLoad requests transactions from storage if a CoValue has listeners", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValuesWithAvailableInStorageTxs,
    );

    node.coValues[coValueID1].dependents.push(coValueID2);

    const { effects } = stageLoad(node);
    expect(effects).toEqual([
      {
        type: "loadTransactionsFromStorage",
        id: coValueID1,
        sessionID: sessionID1,
        from: 0,
        to: 1,
      },
    ]);

    expect(
      node.coValues[coValueID1].sessions[sessionID1]?.transactions,
    ).toEqual([
      { state: "loadingFromStorage" },
      { state: "loadingFromStorage" },
    ]);

    expect(
      node.coValues[coValueID2].sessions[sessionID1]?.transactions,
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
        [sessionID1]: 5,
      },
    };

    onMetadataLoaded(node, coValueID1, header, knownState);

    const { result: result1 } = addTransaction(
      node,
      coValueID1,
      sessionID1,
      0,
      [tx1, tx2],
      "signature_after2" as Signature,
    );

    expect(result1).toEqual({ type: "success" });
    expect(node.coValues[coValueID1].sessions[sessionID1]).toEqual({
      id: sessionID1,
      lastAvailable: 1,
      lastDepsAvailable: -1,
      lastVerified: -1,
      lastDecrypted: -1,
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
      streamingHash: null,
    } satisfies SessionState);

    const { result: result2 } = addTransaction(
      node,
      coValueID1,
      sessionID1,
      2,
      [tx3, tx4, tx5],
      "signature_after5" as Signature,
    );

    expect(result2).toEqual({ type: "success" });
    expect(node.coValues[coValueID1].sessions[sessionID1]).toEqual({
      id: sessionID1,
      lastAvailable: 4,
      lastDepsAvailable: -1,
      lastVerified: -1,
      lastDecrypted: -1,
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
      streamingHash: null,
    } satisfies SessionState);
  });
});
