import { describe, expect, test } from "vitest";
import { RawCoID } from "../../exports.js";
import { subscribe } from "../../localNode/actions/subscribing.js";
import { stageLoad } from "../../localNode/stages/0_load.js";
import { stageSync } from "../../localNode/stages/6_sync.js";
import { emptyNode } from "../../localNode/structure.js";

describe("Syncing", () => {
  const node = emptyNode();
  const coValueID1 = "co_zCoValueID1" as RawCoID;
  const coValueID2 = "co_z" as RawCoID;
  const _1 = subscribe(node, coValueID1);

  stageLoad(node);

  const _2 = subscribe(node, coValueID2);

  test("stageSync doesn't do anything and causes no effects on CoValues with storage state unknown or pending", () => {
    const coValuesBefore = structuredClone(node.coValues);
    const { effects } = stageSync(node);
    expect(effects).toEqual([]);
    expect(node.coValues).toEqual(coValuesBefore);
  });
});
