import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  SyncMessagesLog,
  loadCoValueOrFail,
  setupTestNode,
  waitFor,
} from "./testUtils";

function setupMesh() {
  const coreServer = setupTestNode({
    isSyncServer: true,
  });

  coreServer.addStoragePeer({
    ourName: "core",
  });

  const edgeItaly = setupTestNode();
  edgeItaly.connectToSyncServer({
    ourName: "edge-italy",
    syncServerName: "core",
  });

  const edgeFrance = setupTestNode();
  edgeFrance.connectToSyncServer({
    ourName: "edge-france",
    syncServerName: "core",
  });

  return { coreServer, edgeItaly, edgeFrance };
}

describe("multiple clients syncing with the a cloud-like server mesh", () => {
  let mesh = setupMesh();

  beforeEach(async () => {
    SyncMessagesLog.clear();
    mesh = setupMesh();
  });

  test("loading a coValue created on a different edge", async () => {
    const client = setupTestNode();

    client.connectToSyncServer({
      syncServerName: "edge-italy",
      syncServer: mesh.edgeItaly.node,
    });

    const group = mesh.edgeFrance.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    await map.core.waitForSync();

    const mapOnClient = await loadCoValueOrFail(client.node, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "edge-france -> core | CONTENT Group header: true new: After: 0 New: 3",
        "core -> edge-france | KNOWN Group sessions: header/3",
        "core -> storage | CONTENT Group header: true new: After: 0 New: 3",
        "edge-france -> core | CONTENT Map header: true new: After: 0 New: 1",
        "storage -> core | KNOWN Group sessions: header/3",
        "core -> edge-france | KNOWN Map sessions: header/1",
        "core -> storage | CONTENT Map header: true new: After: 0 New: 1",
        "client -> edge-italy | LOAD Map sessions: empty",
        "storage -> core | KNOWN Map sessions: header/1",
        "edge-italy -> core | LOAD Map sessions: empty",
        "core -> edge-italy | CONTENT Group header: true new: After: 0 New: 3",
        "edge-italy -> core | KNOWN Group sessions: header/3",
        "core -> edge-italy | CONTENT Map header: true new: After: 0 New: 1",
        "edge-italy -> core | KNOWN Map sessions: header/1",
        "edge-italy -> client | CONTENT Group header: true new: After: 0 New: 3",
        "client -> edge-italy | KNOWN Group sessions: header/3",
        "edge-italy -> client | CONTENT Map header: true new: After: 0 New: 1",
        "client -> edge-italy | KNOWN Map sessions: header/1",
      ]
    `);
  });

  // FIXME: Expected parent group to be loaded: CoValue co_zEKiodKQprnfsi2qfDtsHGCGDSo not yet loaded
  test.skip("coValue created on a different edge with parent groups loading", async () => {
    const client = setupTestNode();

    client.connectToSyncServer({
      syncServerName: "edge-italy",
      syncServer: mesh.edgeItaly.node,
    });

    const group = mesh.edgeFrance.node.createGroup();
    const parentGroup = mesh.edgeItaly.node.createGroup();
    parentGroup.addMember("everyone", "reader");

    group.extend(parentGroup);

    const map = group.createMap();
    map.set("hello", "world");

    await map.core.waitForSync();

    const mapOnClient = await loadCoValueOrFail(client.node, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        ParentGroup: parentGroup.core,
        Group: group.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot();
  });

  test("updating a coValue coming from a different edge", async () => {
    const client = setupTestNode();

    client.connectToSyncServer({
      syncServerName: "edge-italy",
      syncServer: mesh.edgeItaly.node,
    });

    const group = mesh.edgeFrance.node.createGroup();
    group.addMember("everyone", "writer");
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    await map.core.waitForSync();

    const mapOnClient = await loadCoValueOrFail(client.node, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    SyncMessagesLog.clear(); // We want to focus on the sync messages happening from now
    mapOnClient.set("hello", "updated", "trusting");

    await waitFor(() => {
      expect(map.get("hello")).toEqual("updated");
    });

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "client -> edge-italy | CONTENT Map header: false new: After: 0 New: 1",
        "edge-italy -> client | KNOWN Map sessions: header/2",
        "edge-italy -> core | CONTENT Map header: false new: After: 0 New: 1",
        "core -> edge-italy | KNOWN Map sessions: header/2",
        "core -> storage | CONTENT Map header: false new: After: 0 New: 1",
        "storage -> core | KNOWN Map sessions: header/2",
        "core -> edge-france | CONTENT Map header: false new: After: 0 New: 1",
        "edge-france -> core | KNOWN Map sessions: header/2",
      ]
    `);
  });

  test("sync of changes of a coValue with bad signatures should be blocked", async () => {
    const italianClient = setupTestNode();
    const frenchClient = setupTestNode();

    italianClient.connectToSyncServer({
      syncServerName: "edge-italy",
      syncServer: mesh.edgeItaly.node,
    });

    frenchClient.connectToSyncServer({
      syncServerName: "edge-france",
      syncServer: mesh.edgeFrance.node,
    });

    const group = mesh.edgeFrance.node.createGroup();
    const map = group.createMap();

    map.set("hello", "world", "trusting");

    const mapOnFrenchClient = await loadCoValueOrFail(
      frenchClient.node,
      map.id,
    );
    const mapOnItalianClient = await loadCoValueOrFail(
      italianClient.node,
      map.id,
    );

    expect(mapOnItalianClient.get("hello")).toEqual("world");
    expect(mapOnFrenchClient.get("hello")).toEqual("world");

    // Return an invalid signature on the next transaction
    vi.spyOn(italianClient.node.crypto, "sign").mockReturnValueOnce(
      "signature_z2jYFqH6hey3Yy8EdgjFxDtD7MJWnNMkhBx5snKsBdFRNJgtPSNK73LrAyCjzMjH5f2nsssT5MbYm8r6tKJJGWDEB",
    );

    SyncMessagesLog.clear(); // We want to focus on the sync messages happening from now
    mapOnItalianClient.set("hello", "updated", "trusting");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mapOnFrenchClient.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "client -> edge-italy | CONTENT Map header: false new: After: 0 New: 1",
        "edge-italy -> client | KNOWN Map sessions: header/1",
      ]
    `);
  });
});
