import { describe, expect, test } from "vitest";
import { Signature } from "../../crypto/crypto.js";
import { subscribe } from "../../localNode/actions/subscribing.js";
import { stageVerify } from "../../localNode/stages/2_verify.js";

import { TransactionState, emptyNode } from "../../localNode/structure.js";
import { MockCrypto } from "../MockCrypto.js";
import {
  crypto,
  coValueID1,
  coValueID2,
  scenarios,
  sessionID1,
  signatureAfter2,
  signatureAfter5,
  tx1,
  tx2,
  tx3,
  tx4,
  tx5,
} from "./setup.js";

describe("stageVerify", () => {
  test("stageVerify does nothing for CoValues without listeners or dependents", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);

    const coValuesBefore = structuredClone(node.coValues);

    stageVerify(node, new MockCrypto(crypto));
    expect(node.coValues).toEqual(coValuesBefore);
  });

  test("stageVerify verifies a CoValue if it has listeners (primitive signer)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);

    const _ = subscribe(node, coValueID1);

    stageVerify(node, new MockCrypto(crypto));

    expect(node.coValues[coValueID1].sessions[sessionID1].lastVerified).toEqual(
      4,
    );
    expect(node.coValues[coValueID1].sessions[sessionID1].transactions).toEqual(
      [
        {
          state: "verified" as const,
          tx: tx1,
          signature: null,
          validity: { type: "unknown" },
          decryptionState: { type: "notDecrypted" },
          stored: false,
        },
        {
          state: "verified" as const,
          tx: tx2,
          signature: signatureAfter2,
          validity: { type: "unknown" },
          decryptionState: { type: "notDecrypted" },
          stored: false,
        },
        {
          state: "verified" as const,
          tx: tx3,
          signature: null,
          validity: { type: "unknown" },
          decryptionState: { type: "notDecrypted" },
          stored: false,
        },
        {
          state: "verified" as const,
          tx: tx4,
          signature: null,
          validity: { type: "unknown" },
          decryptionState: { type: "notDecrypted" },
          stored: false,
        },
        {
          state: "verified" as const,
          tx: tx5,
          signature: signatureAfter5,
          validity: { type: "unknown" },
          decryptionState: { type: "notDecrypted" },
          stored: false,
        },
      ] satisfies TransactionState[],
    );
  });

  test("stageVerify verifies a CoValue if it has listeners (invalid signature, primitive signer)", () => {
    const node = emptyNode();

    const coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);
    coValues[coValueID1].sessions[sessionID1].transactions[1].signature =
      "signature_zInvalid1";
    coValues[coValueID1].sessions[sessionID1].transactions[4].signature =
      "signature_zInvalid2";

    node.coValues = coValues;
    const _ = subscribe(node, coValueID1);

    stageVerify(node, new MockCrypto(crypto));

    expect(node.coValues[coValueID1].sessions[sessionID1].lastVerified).toEqual(
      4,
    );
    expect(node.coValues[coValueID1].sessions[sessionID1].transactions).toEqual(
      [
        {
          state: "verificationFailed" as const,
          tx: tx1,
          signature: null,
          reason: "Invalid signature at idx 1",
          hash: null,
        },
        {
          state: "verificationFailed" as const,
          tx: tx2,
          signature: "signature_zInvalid1" as Signature,
          reason: "Invalid signature (here)",
          hash: "hash_zEyyx6wfnEsvcc4Br2hUSApxgdmpMitin3QHtLyPDxepA",
        },
        {
          state: "verificationFailed" as const,
          tx: tx3,
          signature: null,
          reason: "Invalid signature at idx 1",
          hash: null,
        },
        {
          state: "verificationFailed" as const,
          tx: tx4,
          signature: null,
          reason: "Invalid signature at idx 1",
          hash: null,
        },
        {
          state: "verificationFailed" as const,
          tx: tx5,
          signature: "signature_zInvalid2" as Signature,
          reason: "Invalid signature at idx 1",
          hash: null,
        },
      ] satisfies TransactionState[],
    );
  });

  test("stageVerify verifies a CoValue if it has listeners (account signer)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsAccountOwnerOfCoValue1);

    const _ = subscribe(node, coValueID1);

    stageVerify(node, new MockCrypto(crypto));

    expect(
      node.coValues[coValueID1].sessions[`${coValueID2}_session1`].lastVerified,
    ).toEqual(4);
    expect(
      node.coValues[coValueID1].sessions[`${coValueID2}_session1`].transactions,
    ).toEqual([
      {
        state: "verified" as const,
        tx: tx1,
        signature: null,
        validity: { type: "unknown" },
        decryptionState: { type: "notDecrypted" },
        stored: false,
      },
      {
        state: "verified" as const,
        tx: tx2,
        signature: signatureAfter2,
        validity: { type: "unknown" },
        decryptionState: { type: "notDecrypted" },
        stored: false,
      },
      {
        state: "verified" as const,
        tx: tx3,
        signature: null,
        validity: { type: "unknown" },
        decryptionState: { type: "notDecrypted" },
        stored: false,
      },
      {
        state: "verified" as const,
        tx: tx4,
        signature: null,
        validity: { type: "unknown" },
        decryptionState: { type: "notDecrypted" },
        stored: false,
      },
      {
        state: "verified" as const,
        tx: tx5,
        signature: signatureAfter5,
        validity: { type: "unknown" },
        decryptionState: { type: "notDecrypted" },
        stored: false,
      },
    ] satisfies TransactionState[]);
  });

  test("stageVerify verifies a CoValue if it has listeners (invalid signature, account signer)", () => {
    const node = emptyNode();

    const coValues = structuredClone(
      scenarios.coValue2IsAccountOwnerOfCoValue1,
    );
    coValues[coValueID1].sessions[
      `${coValueID2}_session1`
    ].transactions[1].signature = "signature_zInvalid1";
    coValues[coValueID1].sessions[
      `${coValueID2}_session1`
    ].transactions[4].signature = "signature_zInvalid2";

    node.coValues = coValues;

    const _ = subscribe(node, coValueID1);

    stageVerify(node, new MockCrypto(crypto));

    expect(
      node.coValues[coValueID1].sessions[`${coValueID2}_session1`].lastVerified,
    ).toEqual(4);
    expect(
      node.coValues[coValueID1].sessions[`${coValueID2}_session1`].transactions,
    ).toEqual([
      {
        state: "verificationFailed" as const,
        tx: tx1,
        signature: null,
        reason: "Invalid signature at idx 1",
        hash: null,
      },
      {
        state: "verificationFailed" as const,
        tx: tx2,
        signature: "signature_zInvalid1" as Signature,
        reason: "Invalid signature (here)",
        hash: "hash_zEyyx6wfnEsvcc4Br2hUSApxgdmpMitin3QHtLyPDxepA",
      },
      {
        state: "verificationFailed" as const,
        tx: tx3,
        signature: null,
        reason: "Invalid signature at idx 1",
        hash: null,
      },
      {
        state: "verificationFailed" as const,
        tx: tx4,
        signature: null,
        reason: "Invalid signature at idx 1",
        hash: null,
      },
      {
        state: "verificationFailed" as const,
        tx: tx5,
        signature: "signature_zInvalid2" as Signature,
        reason: "Invalid signature at idx 1",
        hash: null,
      },
    ] satisfies TransactionState[]);
  });
});
