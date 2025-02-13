import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  CoValueCore,
  CojsonInternalTypes,
  ControlledAgent,
  LocalNode,
  RawCoID,
  RawCoMap,
  StorageAdapter,
} from "cojson";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { CoValueKnownState } from "cojson/src/sync.js";
import {
  assert,
  afterEach,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
} from "vitest";
import { SQLiteStorageAdapter } from "../storageAdapter";

async function setup() {
  const crypto = await WasmCrypto.create();

  const agentSecret = crypto.newRandomAgentSecret();
  const agentID = crypto.getAgentID(agentSecret);

  // Create a temporary database file for each test
  const dbPath = join(
    tmpdir(),
    `test-${Math.random().toString(36).slice(2)}.db`,
  );
  const storageAdapter = SQLiteStorageAdapter.load(dbPath);
  const node = new LocalNode(
    new ControlledAgent(agentSecret, crypto),
    crypto.newRandomSessionID(agentID),
    crypto,
  );

  const storageDriver = new TestStorageDriver(
    storageAdapter,
    new LocalNode(
      new ControlledAgent(agentSecret, crypto),
      crypto.newRandomSessionID(agentID),
      crypto,
    ),
  );

  onTestFinished(() => {
    // Clean up the temporary database file
    try {
      unlinkSync(dbPath);
    } catch (e) {
      // Ignore errors if file doesn't exist
    }
  });

  function createTestNode() {
    const newNode = new LocalNode(
      new ControlledAgent(agentSecret, crypto),
      crypto.newRandomSessionID(agentID),
      crypto,
    );

    // Connect nodes initially
    const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
      "node1ToNode2",
      "node2ToNode1",
      {
        peer1role: "server",
        peer2role: "server",
      },
    );

    node.syncManager.addPeer(node2ToNode1Peer);
    newNode.syncManager.addPeer(node1ToNode2Peer);

    return newNode;
  }

  return {
    storageAdapter,
    node,
    storageDriver,
    createTestNode,
  };
}

describe("SQLiteStorageAdapter", () => {
  test("should return null when getting non-existent CoValue", async () => {
    const { storageAdapter } = await setup();
    const result = await storageAdapter.get("non_existent_id" as RawCoID);
    expect(result).toBeNull();
  });

  test("should write and retrieve header", async () => {
    const { node, storageAdapter } = await setup();
    const coValue = node.createGroup().core;

    await storageAdapter.writeHeader(coValue.id, coValue.header);

    const result = await storageAdapter.get(coValue.id);
    expect(result).not.toBeNull();
    expect(result?.header).toEqual(coValue.header);
    expect(result?.sessions.size).toBe(0);
  });

  test("should append and retrieve session transactions", async () => {
    const { node, storageDriver } = await setup();
    const group = node.createGroup();

    const map = group.createMap({ name: "test" });

    await storageDriver.set(group.core);
    await storageDriver.set(map.core);

    await storageDriver.get(group.core.id); // Load the dependency first
    const result = await storageDriver.get(map.core.id);
    expect(result).not.toBeNull();

    const mapFromStrorage = result?.getCurrentContent() as RawCoMap;
    expect(mapFromStrorage).not.toBeNull();
    expect(mapFromStrorage?.get("name")).toBe("test");
  });

  test("should handle multiple transactions for same CoValue", async () => {
    const { node, storageDriver } = await setup();
    const group = node.createGroup();
    await storageDriver.set(group.core);

    const map = group.createMap({ count: 1 });

    await storageDriver.set(map.core);

    map.set("count", 2);

    await storageDriver.set(map.core);

    map.set("count", 3);

    await storageDriver.set(map.core);

    await storageDriver.get(group.core.id); // Load the dependency first
    const result = await storageDriver.get(map.core.id);
    expect(result).not.toBeNull();

    const mapFromStrorage = result?.getCurrentContent() as RawCoMap;
    expect(mapFromStrorage).not.toBeNull();
    expect(mapFromStrorage?.get("count")).toBe(3);
  });

  test("should handle multiple sessions for same CoValue", async () => {
    const { node, storageDriver, createTestNode } = await setup();
    const node2 = createTestNode();
    const group = node.createGroup();
    await storageDriver.set(group.core);

    const map = group.createMap({ count: 1 });

    await storageDriver.set(map.core);

    const mapOnNode2 = await node2.load(map.id);

    assert(mapOnNode2 !== "unavailable", "Map should be loaded");

    mapOnNode2.set("count", 2);
    mapOnNode2.set("count", 3);

    await storageDriver.set(mapOnNode2.core);

    await storageDriver.get(group.core.id); // Load the dependency first
    const result = await storageDriver.get(map.core.id);
    expect(result).not.toBeNull();

    const mapFromStrorage = result?.getCurrentContent() as RawCoMap;
    expect(mapFromStrorage).not.toBeNull();
    expect(mapFromStrorage?.get("count")).toBe(3);
  });
});

class TestStorageDriver {
  private storageAdapter: StorageAdapter;
  private storedStates: Map<RawCoID, CoValueKnownState> = new Map();
  private node: LocalNode;

  constructor(storageAdapter: StorageAdapter, node: LocalNode) {
    this.storageAdapter = storageAdapter;
    this.node = node;
  }

  async get(id: RawCoID) {
    const storedCoValue = await this.storageAdapter.get(id);

    if (!storedCoValue) {
      return null;
    }

    const core = new CoValueCore(storedCoValue.header, this.node);
    this.node.coValuesStore.setAsAvailable(core.id, core);

    for (const [sessionID, sessionLog] of storedCoValue.sessions) {
      let start = 0;
      for (const [signatureAt, signature] of Object.entries(
        sessionLog.signatureAfter,
      )) {
        if (!signature) {
          throw new Error(
            `Expected signature at ${signatureAt} for session ${sessionID}`,
          );
        }

        try {
          core
            .tryAddTransactions(
              sessionID,
              sessionLog.transactions.slice(start, parseInt(signatureAt)),
              undefined,
              signature,
              { skipStorage: true },
            )
            ._unsafeUnwrap();
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
    }

    this.storedStates.set(id, core.knownState());

    return core;
  }

  async set(core: CoValueCore) {
    const currentState = this.storedStates.get(core.id);

    if (!currentState) {
      this.storageAdapter.writeHeader(core.id, core.header);
    }

    const newContentPieces = core.newContentSince(currentState);

    if (!newContentPieces) {
      return;
    }

    const knownState = core.knownState();

    for (const piece of newContentPieces) {
      for (const [sessionID, sessionNewContent] of Object.entries(
        piece.new,
      ) as [
        keyof typeof piece.new,
        (typeof piece.new)[keyof typeof piece.new],
      ][]) {
        await this.storageAdapter.appendToSession(
          core.id,
          sessionID,
          sessionNewContent.after,
          sessionNewContent.newTransactions,
          sessionNewContent.lastSignature,
        );
      }
    }

    this.storedStates.set(core.id, knownState);
  }
}
