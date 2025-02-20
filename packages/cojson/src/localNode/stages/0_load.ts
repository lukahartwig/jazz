import { SessionID } from "../../exports.js";
import {
  LoadMetadataFromStorageEffect,
  LoadTransactionsFromStorageEffect,
} from "../effects.js";
import { LocalNodeState, SessionState } from "../structure.js";

export function stageLoad(node: LocalNodeState): {
  effects: (
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
  )[];
} {
  const effects: (
    | LoadMetadataFromStorageEffect
    | LoadTransactionsFromStorageEffect
  )[] = [];
  for (const coValue of Object.values(node.coValues)) {
    if (coValue.storageState === "unknown") {
      effects.push({ type: "loadMetadataFromStorage", id: coValue.id });
      coValue.storageState = "pending";
    } else if (coValue.storageState === "pending") {
      continue;
    } else if (coValue.storageState === "unavailable") {
      continue;
    } else {
      if (
        Object.keys(coValue.listeners).length == 0 &&
        coValue.dependents.length === 0
      )
        continue;
      for (const [sessionID, session] of Object.entries(coValue.sessions) as [
        SessionID,
        SessionState,
      ][]) {
        let firstToLoad = -1;
        let lastToLoad = -1;

        for (let i = 0; i < session.transactions.length; i++) {
          if (session.transactions[i]?.state === "availableInStorage") {
            if (firstToLoad === -1) {
              firstToLoad = i;
            }
            lastToLoad = i;
            session.transactions[i] = { state: "loadingFromStorage" };
          }
        }

        if (firstToLoad !== -1) {
          effects.push({
            type: "loadTransactionsFromStorage",
            id: coValue.id,
            sessionID,
            from: firstToLoad,
            to: lastToLoad,
          });
        }
      }
    }
  }
  return { effects };
}
