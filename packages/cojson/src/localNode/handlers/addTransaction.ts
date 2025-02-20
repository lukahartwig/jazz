import { Transaction } from "../../coValueCore.js";
import { Signature } from "../../crypto/crypto.js";
import { RawCoID, SessionID } from "../../exports.js";
import { LocalNodeState } from "../structure.js";

export function addTransaction(
  node: LocalNodeState,
  id: RawCoID,
  sessionID: SessionID,
  after: number,
  transactions: Transaction[],
  signature: Signature,
): {
  result: { type: "success" } | { type: "gap"; expectedAfter: number };
} {
  const entry = node.coValues[id];
  if (!entry) {
    throw new Error("CoValue not found");
  }
  const session = entry.sessions[sessionID];
  if (!session) {
    throw new Error("Session not found");
  }
  if (after > session.transactions.length) {
    return {
      result: { type: "gap", expectedAfter: session.transactions.length },
    };
  }
  for (let i = 0; i < transactions.length; i++) {
    const sessionIdx = after + i;
    if (
      session.transactions[sessionIdx] &&
      session.transactions[sessionIdx]!.state !== "availableInStorage"
    ) {
      throw new Error(
        `Unexpected existing state ${session.transactions[sessionIdx]!.state} at index ${sessionIdx}`,
      );
    }
    session.transactions[sessionIdx] = {
      state: "available",
      tx: transactions[i]!,
      signature: i === transactions.length - 1 ? signature : null,
    };
    session.lastAvailable = Math.max(session.lastAvailable, sessionIdx);
  }
  return { result: { type: "success" } };
}
