import {
  type Mocked,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import type {
  CojsonInternalTypes,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
} from "cojson";
import { StorageManagerAsync as SyncManager } from "../managerAsync.js";
import { getDependedOnCoValues } from "../syncUtils.js";
import type { DBClientInterfaceAsync as DBClientInterface } from "../types.js";
import { fixtures } from "./fixtureMessages.js";

type RawCoID = CojsonInternalTypes.RawCoID;
type NewContentMessage = CojsonInternalTypes.NewContentMessage;
vi.mock("../syncUtils");

const coValueIdToLoad = "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m";
const createEmptyLoadMsg = (id: string) =>
  ({
    action: "load",
    id,
    header: false,
    sessions: {},
  }) as SyncMessage;

const sessionsData = fixtures[coValueIdToLoad].sessionRecords;
const coValueHeader = fixtures[coValueIdToLoad].getContent({ after: 0 }).header;
const incomingContentMessage = fixtures[coValueIdToLoad].getContent({
  after: 0,
}) as SyncMessage;

describe("DB sync manager", () => {
  let syncManager: SyncManager;
  const queue: OutgoingSyncQueue = {} as unknown as OutgoingSyncQueue;

  const DBClient = vi.fn();
  DBClient.prototype.getCoValue = vi.fn();
  DBClient.prototype.getCoValueSessions = vi.fn();
  DBClient.prototype.getSingleCoValueSession = vi.fn();
  DBClient.prototype.getNewTransactionInSession = vi.fn();
  DBClient.prototype.addSessionUpdate = vi.fn();
  DBClient.prototype.addTransaction = vi.fn();
  DBClient.prototype.transaction = vi.fn((callback) => callback());

  beforeEach(async () => {
    const idbClient = new DBClient() as unknown as Mocked<DBClientInterface>;
    syncManager = new SyncManager(idbClient, queue);
    syncManager.sendStateMessage = vi.fn();

    // No dependencies found
    vi.mocked(getDependedOnCoValues).mockReturnValue(new Set());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("Incoming known messages are not processed", async () => {
    await syncManager.handleSyncMessage({ action: "known" } as SyncMessage);
    expect(syncManager.sendStateMessage).not.toBeCalled();
  });

  describe("Handle load incoming message", () => {
    test("sends empty known message for unknown coValue", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);

      DBClient.prototype.getCoValue.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueIdToLoad,
        sessions: {},
      });
    });

    test("Sends known and content message for known coValue with no sessions", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);

      DBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      DBClient.prototype.getCoValueSessions.mockResolvedValueOnce([]);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledTimes(1);
      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "content",
        header: expect.objectContaining({
          type: expect.any(String),
          ruleset: expect.any(Object),
        }),
        id: coValueIdToLoad,
        new: {},
        priority: 0,
      });
    });

    test("Sends messages for unique coValue dependencies only, leaving out circular dependencies", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);
      const dependency1 = "co_zMKhQJs5rAeGjta3JX2qEdBS6hS";
      const dependency2 = "co_zP51HdyAVCuRY9ptq5iu8DhMyAb";
      const dependency3 = "co_zGyBniuJmKkcirCKYrccWpjQEFY";
      const dependenciesTreeWithLoop: Record<RawCoID, RawCoID[]> = {
        [coValueIdToLoad]: [dependency1, dependency2],
        [dependency1]: [],
        [dependency2]: [coValueIdToLoad, dependency3],
        [dependency3]: [dependency1],
      };

      DBClient.prototype.getCoValue.mockImplementation(
        (coValueId: RawCoID) => ({
          id: coValueId,
          header: coValueHeader,
          rowID: 3,
        }),
      );

      DBClient.prototype.getCoValueSessions.mockResolvedValue([]);

      // Fetch dependencies of the current dependency for the future recursion iterations
      vi.mocked(getDependedOnCoValues).mockImplementation(
        (_, msg) => new Set(dependenciesTreeWithLoop[msg.id] || []),
      );

      await syncManager.handleSyncMessage(loadMsg);

      // We send out pairs (known + content) messages only FOUR times - as many as the coValues number
      // and less than amount of interconnected dependencies to loop through in dependenciesTreeWithLoop
      expect(syncManager.sendStateMessage).toBeCalledTimes(4);

      const contentExpected = {
        action: "content",
        header: expect.any(Object),
        new: {},
        priority: 0,
      };

      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(1, {
        ...contentExpected,
        id: dependency1,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(2, {
        ...contentExpected,
        id: dependency3,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(3, {
        ...contentExpected,
        id: dependency2,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(4, {
        ...contentExpected,
        id: coValueIdToLoad,
      });
    });
  });

  describe("Handle content incoming message", () => {
    test("Sends correction message for unknown coValue", async () => {
      DBClient.prototype.getCoValue.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage({
        ...incomingContentMessage,
        header: undefined,
      } as SyncMessage);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueIdToLoad,
        isCorrection: true,
        sessions: {},
      });
    });

    test("Saves new transaction and sends an ack message as response", async () => {
      DBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      DBClient.prototype.getCoValueSessions.mockResolvedValueOnce([]);
      const msg = {
        ...incomingContentMessage,
        header: undefined,
      } as NewContentMessage;

      await syncManager.handleSyncMessage(msg);

      const incomingTxCount = Object.keys(msg.new).reduce(
        (acc, sessionID) =>
          acc + msg.new[sessionID as SessionID]!.newTransactions.length,
        0,
      );
      expect(DBClient.prototype.addTransaction).toBeCalledTimes(
        incomingTxCount,
      );

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueIdToLoad,
        sessions: expect.any(Object),
      });
    });

    test("Sends correction message when peer sends a message far ahead of our state due to invalid assumption", async () => {
      DBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      DBClient.prototype.getCoValueSessions.mockResolvedValueOnce(sessionsData);

      const farAheadContentMessage = fixtures[coValueIdToLoad].getContent({
        after: 10000,
      });
      await syncManager.handleSyncMessage(
        farAheadContentMessage as SyncMessage,
      );

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueIdToLoad,
        isCorrection: true,
        sessions: expect.any(Object),
      });
    });
  });
});
