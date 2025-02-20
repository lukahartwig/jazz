import { SignerID, StreamingHash } from "../../crypto/crypto.js";
import { AgentID, CryptoProvider, RawCoID } from "../../exports.js";
import { isAgentID } from "../../ids.js";
import { parseJSON } from "../../jsonStringify.js";
import { accountOrAgentIDfromSessionID } from "../../typeUtils/accountOrAgentIDfromSessionID.js";
import {
  CoValueState,
  LocalNodeState,
  SessionState,
  TransactionState,
} from "../structure.js";

export function stageVerify(node: LocalNodeState, crypto: CryptoProvider) {
  for (const coValue of Object.values(node.coValues)) {
    if (
      coValue.storageState === "pending" ||
      coValue.storageState === "unknown" ||
      (Object.keys(coValue.listeners).length === 0 &&
        coValue.dependents.length === 0)
    ) {
      continue;
    }
    for (const session of Object.values(coValue.sessions)) {
      if (session.lastVerified == session.lastAvailable) {
        continue;
      }

      verifySession(node, session, coValue.id, crypto);
    }
  }
}

function verifySession(
  node: LocalNodeState,
  session: SessionState,
  coValueID: RawCoID,
  crypto: CryptoProvider,
) {
  const streamingHash =
    session.streamingHash?.clone() ?? new StreamingHash(crypto);

  for (let i = session.lastVerified + 1; i <= session.lastAvailable; i++) {
    const txState = session.transactions[i];

    if (txState?.state !== "available") {
      throw new Error(
        `Transaction ${i} is not available in ${coValueID} ${session.id}`,
      );
    }

    streamingHash.update(txState.tx);

    if (txState.signature) {
      const hash = streamingHash.digest();
      const authorID = accountOrAgentIDfromSessionID(session.id);
      let signerID: SignerID;
      if (isAgentID(authorID)) {
        signerID = crypto.getAgentSignerID(authorID);
      } else {
        const authorAccount = node.coValues[authorID];
        if (!authorAccount) {
          throw new Error(
            `Author covalue ${authorID} not present, not yet handled`,
          );
        }
        const foundAgentIDs = findAgentIDsInAccount(authorAccount);
        if (foundAgentIDs.length > 1) {
          throw new Error(
            `Multiple agent IDs found in ${authorID} - not yet handled`,
          );
        }
        const onlyAgent = foundAgentIDs[0];
        if (!onlyAgent) {
          throw new Error(`No agent ID found in ${authorID} - not yet handled`);
        }
        signerID = crypto.getAgentSignerID(onlyAgent);
      }
      if (crypto.verify(txState.signature, hash, signerID)) {
        for (let v = session.lastVerified + 1; v <= i; v++) {
          session.transactions[v] = {
            ...(session.transactions[v] as TransactionState & {
              state: "available";
            }),
            state: "verified",
            validity: { type: "unknown" },
            decryptionState: { type: "notDecrypted" },
            stored: false,
          };
        }
        session.lastVerified = i;
      } else {
        console.log(
          `Signature verification failed for transaction ${i} in ${coValueID} ${session.id}`,
        );

        for (
          let iv = session.lastVerified + 1;
          iv <= session.lastAvailable;
          iv++
        ) {
          session.transactions[iv] = {
            ...(session.transactions[iv] as TransactionState & {
              state: "available";
            }),
            state: "verificationFailed",
            reason: `Invalid signature ${iv === i ? "(here)" : `at idx ${i}`}`,
            hash: iv === i ? hash : null,
          };
        }
        session.lastVerified = session.lastAvailable;
        return;
      }
    }
  }
}

function findAgentIDsInAccount(authorAccount: CoValueState): AgentID[] {
  return Object.values(authorAccount.sessions).flatMap((session) =>
    session.transactions.flatMap((tx) => {
      if (tx.state === "verified" && tx.tx.privacy === "trusting") {
        // TODO: this should read from the tx.decryptionState.changes instead
        const changes = parseJSON(tx.tx.changes);
        return changes.flatMap((change) => {
          if (
            typeof change === "object" &&
            change !== null &&
            "op" in change &&
            change.op === "set" &&
            "key" in change &&
            typeof change.key === "string" &&
            isAgentID(change.key)
          ) {
            return [change.key as AgentID];
          } else {
            return [];
          }
        });
      } else {
        return [];
      }
    }),
  );
}
