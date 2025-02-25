import { describe, expect, test } from "vitest";
import { subscribe } from "../../localNode/actions/subscribing.js";
import { stageLoadDeps } from "../../localNode/stages/1_loadDeps.js";
import { emptyNode } from "../../localNode/structure.js";
import { coValueID1, scenarios } from "./setup.js";

describe("Loading dependencies", () => {
  test("stageLoadDeps does nothing for CoValues without listeners or dependents", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);
    node.peers = [];

    const coValuesBefore = structuredClone(node.coValues);

    stageLoadDeps(node);
    expect(node.coValues).toEqual(coValuesBefore);
  });

  test("stageLoadDeps adds dependent covalues to an existing coValue's dependencies if the dependent has listeners (ownedByGroup)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);

    stageLoadDeps(node);

    // idempotency
    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });

  test("stageLoadDeps adds dependents and adds a new entry on missing dependency if the dependent has listeners (ownedByGroup)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(scenarios.coValue2IsGroupOfCoValue1);
    delete node.coValues["co_zCoValueID2"];
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);

    stageLoadDeps(node);

    // idempotency
    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });

  test("stageLoadDeps adds dependent covalues to an existing coValue's dependencies if the dependent has listeners (group member)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValue2IsMemberInCoValue1WhichIsAGroup,
    );
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);

    stageLoadDeps(node);

    // idempotency
    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });

  test("stageLoadDeps adds dependents and adds a new entry on missing dependency if the dependent has listeners (group member)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValue2IsMemberInCoValue1WhichIsAGroup,
    );
    delete node.coValues["co_zCoValueID2"];
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });

  test("stageLoadDeps adds dependent covalues to an existing coValue's dependencies if the dependent has listeners (extended group)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValue2IsExtendedGroupOfCoValue1,
    );
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });

  test("stageLoadDeps adds dependents and adds a new entry on missing dependency if the dependent has listeners (extended group)", () => {
    const node = emptyNode();

    node.coValues = structuredClone(
      scenarios.coValue2IsExtendedGroupOfCoValue1,
    );
    delete node.coValues["co_zCoValueID2"];
    node.peers = [];

    const _ = subscribe(node, coValueID1);

    stageLoadDeps(node);

    expect(node.coValues["co_zCoValueID2"].dependents).toEqual([
      "co_zCoValueID1",
    ]);
  });
});
