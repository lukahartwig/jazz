import { RawCoID, SessionID } from "../../exports.js";
import { LocalNodeState, Transaction } from "../structure.js";

export function makeTransaction(
  node: LocalNodeState,
  id: RawCoID,
  sessionID: SessionID,
  tx: Transaction,
): {
  result: "success" | "failure";
} {
  throw new Error("Not implemented");
}
