import { beforeEach, describe, expect, test } from "vitest";

import { expectList, expectMap } from "../coValue";
import { WasmCrypto } from "../crypto/WasmCrypto";
import {
  SyncMessagesLog,
  loadCoValueOrFail,
  setupTestNode,
  waitFor,
} from "./testUtils";

const Crypto = await WasmCrypto.create();
let jazzCloud = setupTestNode({ isSyncServer: true });

beforeEach(async () => {
  SyncMessagesLog.clear();
  jazzCloud = setupTestNode({ isSyncServer: true });
});

describe("invitations sync", () => {
  test("invite a client to a group", async () => {
    const client = setupTestNode();
    client.connectToSyncServer({
      ourName: "invite-provider",
    });
    const client2 = setupTestNode();
    client2.connectToSyncServer({
      ourName: "invite-consumer",
    });

    const group = client.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world");

    await map.core.waitForSync();

    const invite = group.createInvite("reader");

    await group.core.waitForSync();
    SyncMessagesLog.clear();

    await client2.node.acceptInvite(map.id, invite);

    const mapOnClient2 = await loadCoValueOrFail(client2.node, map.id);
    expect(mapOnClient2.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "invite-consumer -> server | LOAD Map sessions: empty",
        "server -> invite-consumer | CONTENT Group header: true new: After: 0 New: 5",
        "invite-consumer -> server | KNOWN Group sessions: header/5",
        "server -> invite-consumer | CONTENT Map header: true new: After: 0 New: 1",
        "invite-consumer -> server | KNOWN Map sessions: header/1",
        "invite-consumer -> server | CONTENT Group header: false new: After: 0 New: 2",
        "server -> invite-consumer | KNOWN Group sessions: header/7",
        "server -> invite-provider | CONTENT Group header: false new: After: 0 New: 2",
        "invite-provider -> server | KNOWN Group sessions: header/7",
      ]
    `);
  });

  test("invite a client to a group with parents", async () => {
    const client = setupTestNode();
    client.connectToSyncServer({
      ourName: "invite-provider",
    });
    const client2 = setupTestNode();
    client2.connectToSyncServer({
      ourName: "invite-consumer",
    });

    const parentGroup = client.node.createGroup();
    const group = client.node.createGroup();

    group.extend(parentGroup);
    const map = group.createMap();
    map.set("hello", "world");

    await map.core.waitForSync();

    const invite = group.createInvite("reader");

    await group.core.waitForSync();
    SyncMessagesLog.clear();

    await client2.node.acceptInvite(map.id, invite);

    const mapOnClient2 = await loadCoValueOrFail(client2.node, map.id);
    expect(mapOnClient2.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        ParentGroup: parentGroup.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "invite-consumer -> server | LOAD Map sessions: empty",
        "server -> invite-consumer | CONTENT ParentGroup header: true new: After: 0 New: 4",
        "invite-consumer -> server | KNOWN ParentGroup sessions: header/4",
        "server -> invite-consumer | CONTENT Group header: true new: After: 0 New: 7",
        "invite-consumer -> server | KNOWN Group sessions: header/7",
        "server -> invite-consumer | CONTENT Map header: true new: After: 0 New: 1",
        "invite-consumer -> server | KNOWN Map sessions: header/1",
        "invite-consumer -> server | CONTENT Group header: false new: After: 0 New: 2",
        "server -> invite-consumer | KNOWN Group sessions: header/9",
        "server -> invite-provider | CONTENT Group header: false new: After: 0 New: 2",
        "invite-provider -> server | KNOWN Group sessions: header/9",
      ]
    `);
  });

  test("invite a client to a parent group", async () => {
    const client = setupTestNode();
    client.connectToSyncServer({
      ourName: "invite-provider",
    });
    const client2 = setupTestNode();
    client2.connectToSyncServer({
      ourName: "invite-consumer",
    });

    const parentGroup = client.node.createGroup();
    const group = client.node.createGroup();

    group.extend(parentGroup);
    const map = group.createMap();
    map.set("hello", "world");

    await map.core.waitForSync();

    const invite = parentGroup.createInvite("reader");

    await parentGroup.core.waitForSync();
    SyncMessagesLog.clear();

    await client2.node.acceptInvite(parentGroup.id, invite);

    const mapOnClient2 = await loadCoValueOrFail(client2.node, map.id);
    expect(mapOnClient2.get("hello")).toEqual("world");

    expect(
      SyncMessagesLog.getMessages({
        Group: group.core,
        ParentGroup: parentGroup.core,
        Map: map.core,
      }),
    ).toMatchInlineSnapshot(`
      [
        "invite-consumer -> server | LOAD ParentGroup sessions: empty",
        "server -> invite-consumer | CONTENT ParentGroup header: true new: After: 0 New: 6",
        "invite-consumer -> server | KNOWN ParentGroup sessions: header/6",
        "invite-consumer -> server | CONTENT ParentGroup header: false new: After: 0 New: 2",
        "server -> invite-consumer | KNOWN ParentGroup sessions: header/8",
        "server -> invite-provider | CONTENT ParentGroup header: false new: After: 0 New: 2",
        "invite-consumer -> server | LOAD Map sessions: empty",
        "invite-provider -> server | KNOWN ParentGroup sessions: header/8",
        "server -> invite-consumer | CONTENT Group header: true new: After: 0 New: 5",
        "invite-consumer -> server | KNOWN Group sessions: header/5",
        "server -> invite-consumer | CONTENT Map header: true new: After: 0 New: 1",
        "invite-consumer -> server | KNOWN Map sessions: header/1",
      ]
    `);
  });
});
