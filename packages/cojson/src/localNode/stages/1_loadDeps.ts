import { getGroupDependentKey } from "../../ids.js";
import { parseJSON } from "../../jsonStringify.js";
import { LocalNodeState, emptyCoValueState } from "../structure.js";

export function stageLoadDeps(node: LocalNodeState) {
  for (const coValue of Object.values(node.coValues)) {
    if (Object.keys(coValue.listeners).length === 0) {
      continue;
    }
    if (coValue.storageState === "pending") {
      continue;
    }
    if (coValue.header?.ruleset.type === "ownedByGroup") {
      const existing = node.coValues[coValue.header.ruleset.group];
      if (existing) {
        if (!existing.dependents.includes(coValue.id)) {
          existing.dependents.push(coValue.id);
        }
      } else {
        const entry = emptyCoValueState(coValue.header.ruleset.group);
        entry.dependents.push(coValue.id);
        node.coValues[coValue.header.ruleset.group] = entry;
      }
    } else if (coValue.header?.ruleset.type === "group") {
      for (const session of Object.values(coValue.sessions)) {
        for (const tx of session.transactions) {
          if (tx.state === "available" && tx.tx.privacy === "trusting") {
            // TODO: this should read from the tx.decryptionState.changes instead
            const changes = parseJSON(tx.tx.changes);
            for (const change of changes) {
              if (
                typeof change === "object" &&
                change !== null &&
                "op" in change &&
                change.op === "set" &&
                "key" in change
              ) {
                const groupDependency = getGroupDependentKey(change.key);
                if (groupDependency) {
                  const existing = node.coValues[groupDependency];
                  if (existing) {
                    if (!existing.dependents.includes(coValue.id)) {
                      existing.dependents.push(coValue.id);
                    }
                  } else {
                    const entry = emptyCoValueState(groupDependency);
                    entry.dependents.push(coValue.id);
                    node.coValues[groupDependency] = entry;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
