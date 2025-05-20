import {
  type CojsonInternalTypes,
  type JsonValue,
  type SessionID,
  type Stringified,
  cojsonInternals,
} from "cojson";
import type {
  StoredCoValueRow,
  StoredSessionRow,
  TransactionRow,
} from "./types.js";

export function collectNewTxs({
  newTxsInSession,
  contentMessage,
  sessionRow,
  firstNewTxIdx,
  signature,
}: {
  newTxsInSession: TransactionRow[];
  contentMessage: CojsonInternalTypes.NewContentMessage;
  sessionRow: StoredSessionRow;
  signature: CojsonInternalTypes.Signature;
  firstNewTxIdx: number;
}) {
  let sessionEntry = contentMessage.new[sessionRow.sessionID];

  if (!sessionEntry) {
    sessionEntry = {
      after: firstNewTxIdx,
      lastSignature: "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
      newTransactions: [],
    };
    contentMessage.new[sessionRow.sessionID] = sessionEntry;
  }

  for (const tx of newTxsInSession) {
    sessionEntry.newTransactions.push(tx.tx);
  }

  sessionEntry.lastSignature = signature;
}

export function getDependedOnCoValues({
  coValueRow,
  newContentMessages,
}: {
  coValueRow: StoredCoValueRow;
  newContentMessages: CojsonInternalTypes.NewContentMessage[];
}) {
  return coValueRow.header.ruleset.type === "group"
    ? getGroupDependedOnCoValues(newContentMessages)
    : coValueRow.header.ruleset.type === "ownedByGroup"
      ? getOwnedByGroupDependedOnCoValues(coValueRow, newContentMessages)
      : [];
}

function getGroupDependedOnCoValues(
  newContentMessages: CojsonInternalTypes.NewContentMessage[],
) {
  const keys: CojsonInternalTypes.RawCoID[] = [];

  /**
   * Collect all the signing keys inside the transactions to list all the
   * dependencies required to correctly access the CoValue.
   */
  for (const piece of newContentMessages) {
    for (const sessionEntry of Object.values(piece.new)) {
      for (const tx of sessionEntry.newTransactions) {
        if (tx.privacy !== "trusting") continue;

        const changes = safeParseChanges(tx.changes);
        for (const change of changes) {
          if (
            change &&
            typeof change === "object" &&
            "op" in change &&
            change.op === "set" &&
            "key" in change &&
            change.key
          ) {
            const key = cojsonInternals.getGroupDependentKey(change.key);

            if (key) {
              keys.push(key);
            }
          }
        }
      }
    }
  }

  return keys;
}

function getOwnedByGroupDependedOnCoValues(
  coValueRow: StoredCoValueRow,
  newContentMessages: CojsonInternalTypes.NewContentMessage[],
) {
  if (coValueRow.header.ruleset.type !== "ownedByGroup") return [];

  const keys: CojsonInternalTypes.RawCoID[] = [coValueRow.header.ruleset.group];

  /**
   * Collect all the signing keys inside the transactions to list all the
   * dependencies required to correctly access the CoValue.
   */
  for (const piece of newContentMessages) {
    for (const sessionID of Object.keys(piece.new) as SessionID[]) {
      const accountId =
        cojsonInternals.accountOrAgentIDfromSessionID(sessionID);

      if (
        cojsonInternals.isAccountID(accountId) &&
        accountId !== coValueRow.id
      ) {
        keys.push(accountId);
      }
    }
  }

  return keys;
}

function safeParseChanges(changes: Stringified<JsonValue[]>) {
  try {
    return cojsonInternals.parseJSON(changes);
  } catch (e) {
    return [];
  }
}
