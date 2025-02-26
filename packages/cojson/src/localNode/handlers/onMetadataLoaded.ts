import { RawCoID, SessionID } from "../../exports.js";
import { CoValueHeader, KnownState, LocalNodeState } from "../structure.js";

export function onMetadataLoaded(
  node: LocalNodeState,
  id: RawCoID,
  header: CoValueHeader | null,
  knownState: KnownState,
) {
  const entry = node.coValues[id];
  if (!entry) {
    throw new Error("CoValue not found");
  }
  if (header) {
    entry.header = header;
  }
  entry.storageState = knownState;
  if (knownState !== "unknown" && knownState !== "unavailable") {
    for (const sessionID of Object.keys(knownState.sessions) as SessionID[]) {
      let session = entry.sessions[sessionID];
      if (!session) {
        session = {
          id: sessionID,
          transactions: [],
          streamingHash: null,
          lastVerified: -1,
          lastAvailable: -1,
          lastDepsAvailable: -1,
          lastDecrypted: -1,
        };
        entry.sessions[sessionID] = session;
      }
      for (let i = 0; i < (knownState.sessions[sessionID] || 0); i++) {
        if (!session.transactions[i]) {
          session.transactions[i] = { state: "availableInStorage" };
        }
      }
    }
  }
}
