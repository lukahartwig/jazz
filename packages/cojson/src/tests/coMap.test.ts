import { beforeEach, expect, test } from "vitest";
import { expectMap } from "../coValue.js";
import { operationToEditEntry } from "../coValues/coMap.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import {
  hotSleep,
  loadCoValueOrFail,
  nodeWithRandomAgentAndSessionID,
  setupTestNode,
  waitFor,
} from "./testUtils.js";

const Crypto = await WasmCrypto.create();

beforeEach(async () => {
  setupTestNode({ isSyncServer: true });
});

test("Empty CoMap works", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");
  expect([...content.keys()]).toEqual([]);
  expect(content.toJSON()).toEqual({});
});

test("Can insert and delete CoMap entries in edit()", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");

  content.set("hello", "world", "trusting");
  expect(content.get("hello")).toEqual("world");
  content.set("foo", "bar", "trusting");
  expect(content.get("foo")).toEqual("bar");
  expect([...content.keys()]).toEqual(["hello", "foo"]);
  content.delete("foo", "trusting");
  expect(content.get("foo")).toEqual(undefined);
  expect(content.keys()).toEqual(["hello"]);
});

test("Can get CoMap entry values at different points in time", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");

  const beforeA = hotSleep(10);
  content.set("hello", "A", "trusting");
  const beforeB = hotSleep(10);
  content.set("hello", "B", "trusting");
  const beforeC = hotSleep(10);
  content.set("hello", "C", "trusting");
  expect(content.get("hello")).toEqual("C");
  expect(content.atTime(Date.now()).get("hello")).toEqual("C");
  expect(content.atTime(beforeA).get("hello")).toEqual(undefined);
  expect(content.atTime(beforeB).get("hello")).toEqual("A");
  expect(content.atTime(beforeC).get("hello")).toEqual("B");

  const ops = content.ops["hello"]!;

  expect(content.atTime(beforeC).lastEditAt("hello")).toEqual(
    operationToEditEntry(ops[1]!),
  );
  expect(content.atTime(beforeC).nthEditAt("hello", 0)).toEqual(
    operationToEditEntry(ops![0]!),
  );
  expect(content.atTime(beforeC).nthEditAt("hello", 2)).toEqual(undefined);

  expect([...content.atTime(beforeC).editsAt("hello")]).toEqual([
    operationToEditEntry(ops![0]!),
    operationToEditEntry(ops![1]!),
  ]);

  expect(content.atTime(beforeB).asObject()).toEqual({
    hello: "A",
  });

  expect(content.atTime(beforeC).asObject()).toEqual({
    hello: "B",
  });
});

test("Can get all historic values of key in CoMap", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");

  content.set("hello", "A", "trusting");
  const editA = content.lastEditAt("hello");
  content.set("hello", "B", "trusting");
  const editB = content.lastEditAt("hello");
  content.delete("hello", "trusting");
  const editDel = content.lastEditAt("hello");
  content.set("hello", "C", "trusting");
  const editC = content.lastEditAt("hello");
  expect([...content.editsAt("hello")]).toEqual([
    {
      tx: editA!.tx,
      by: node.getCurrentAgent().id,
      value: "A",
      at: editA?.at,
    },
    {
      tx: editB!.tx,
      by: node.getCurrentAgent().id,
      value: "B",
      at: editB?.at,
    },
    {
      tx: editDel!.tx,
      by: node.getCurrentAgent().id,
      value: undefined,
      at: editDel?.at,
    },
    {
      tx: editC!.tx,
      by: node.getCurrentAgent().id,
      value: "C",
      at: editC?.at,
    },
  ]);
});

test("Can get last tx ID for a key in CoMap", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");

  expect(content.lastEditAt("hello")).toEqual(undefined);
  content.set("hello", "A", "trusting");
  const sessionID = content.lastEditAt("hello")?.tx.sessionID;
  expect(sessionID && accountOrAgentIDfromSessionID(sessionID)).toEqual(
    node.getCurrentAgent().id,
  );
  expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(0);
  content.set("hello", "B", "trusting");
  expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(1);
  content.set("hello", "C", "trusting");
  expect(content.lastEditAt("hello")?.tx.txIndex).toEqual(2);
});

test("Can set items in bulk with assign", () => {
  const node = nodeWithRandomAgentAndSessionID();

  const coValue = node.createCoValue({
    type: "comap",
    ruleset: { type: "unsafeAllowAll" },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const content = expectMap(coValue.getCurrentContent());

  expect(content.type).toEqual("comap");

  content.set("key1", "set1", "trusting");

  content.assign(
    {
      key1: "assign1",
      key2: "assign2",
      key3: "assign3",
    },
    "trusting",
  );

  expect(content.toJSON()).toEqual({
    key1: "assign1",
    key2: "assign2",
    key3: "assign3",
  });
});

test("totalValidTransactions should return the number of valid transactions processed", async () => {
  const client = setupTestNode({
    connected: true,
  });
  const otherClient = setupTestNode({});

  const otherClientConnection = otherClient.connectToSyncServer();

  const group = client.node.createGroup();
  group.addMember("everyone", "reader");

  const map = group.createMap({ fromClient: true });

  const mapOnOtherClient = await loadCoValueOrFail(otherClient.node, map.id);

  otherClientConnection.peerState.gracefulShutdown();

  group.addMember("everyone", "writer");

  await new Promise((resolve) => setTimeout(resolve, 50));

  mapOnOtherClient.set("fromOtherClient", true, "trusting");

  expect(mapOnOtherClient.totalValidTransactions).toEqual(1);
  expect(mapOnOtherClient.toJSON()).toEqual({
    fromClient: true,
  });

  otherClient.connectToSyncServer();

  await waitFor(() => {
    expect(mapOnOtherClient.core.getCurrentContent().toJSON()).toEqual({
      fromClient: true,
      fromOtherClient: true,
    });
  });

  expect(
    mapOnOtherClient.core.getCurrentContent().totalValidTransactions,
  ).toEqual(2);
});
