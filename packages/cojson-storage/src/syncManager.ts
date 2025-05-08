import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  type OutgoingSyncQueue,
  type SessionID,
  type SyncMessage,
  cojsonInternals,
  emptyKnownState,
  logger,
} from "cojson";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils.js";
import type { DBClientInterface, StoredSessionRow } from "./types.js";
import NewContentMessage = CojsonInternalTypes.NewContentMessage;
import KnownStateMessage = CojsonInternalTypes.KnownStateMessage;
import RawCoID = CojsonInternalTypes.RawCoID;

type OutputMessageMap = Record<
  RawCoID,
  { knownMessage: KnownStateMessage; contentMessages?: NewContentMessage[] }
>;

export class SyncManager {
  private readonly toLocalNode: OutgoingSyncQueue;
  private readonly dbClient: DBClientInterface;

  private loadedCoValues = new Set<RawCoID>();

  constructor(dbClient: DBClientInterface, toLocalNode: OutgoingSyncQueue) {
    this.toLocalNode = toLocalNode;
    this.dbClient = dbClient;
  }

  async handleSyncMessage(msg: SyncMessage) {
    switch (msg.action) {
      case "load":
        await this.handleLoad(msg);
        break;
      case "content":
        await this.handleContent(msg);
        break;
      case "known":
        await this.handleKnown(msg);
        break;
      case "done":
        await this.handleDone(msg);
        break;
    }
  }

  async handleSessionUpdate({
    sessionRow,
    peerKnownState,
    newContentMessages,
  }: {
    sessionRow: StoredSessionRow;
    peerKnownState: CojsonInternalTypes.CoValueKnownState;
    newContentMessages: CojsonInternalTypes.NewContentMessage[];
  }) {
    if (
      sessionRow.lastIdx <= (peerKnownState.sessions[sessionRow.sessionID] || 0)
    )
      return;

    const firstNewTxIdx = peerKnownState.sessions[sessionRow.sessionID] || 0;

    const newTxsInSession = await this.dbClient.getNewTransactionInSession(
      sessionRow.rowID,
      firstNewTxIdx,
    );

    collectNewTxs({
      newTxsInSession,
      newContentMessages,
      sessionRow,
      firstNewTxIdx,
    });
  }

  async sendNewContent(
    coValueKnownState: CojsonInternalTypes.CoValueKnownState,
  ): Promise<void> {
    const outputMessages: OutputMessageMap =
      await this.collectCoValueData(coValueKnownState);

    // reverse it to send the top level id the last in the order
    const collectedMessages = Object.values(outputMessages).reverse();
    for (const { knownMessage, contentMessages } of collectedMessages) {
      this.sendStateMessage(knownMessage);

      if (contentMessages?.length) {
        for (const msg of contentMessages) {
          this.sendStateMessage(msg);
        }
      }
    }
  }

  private async collectCoValueData(
    peerKnownState: CojsonInternalTypes.CoValueKnownState,
    messageMap: OutputMessageMap = {},
    asDependencyOf?: CojsonInternalTypes.RawCoID,
  ) {
    if (messageMap[peerKnownState.id]) {
      return messageMap;
    }

    const coValueRow = await this.dbClient.getCoValue(peerKnownState.id);

    if (!coValueRow) {
      const emptyKnownMessage: KnownStateMessage = {
        action: "known",
        ...emptyKnownState(peerKnownState.id),
      };
      if (asDependencyOf) {
        emptyKnownMessage.asDependencyOf = asDependencyOf;
      }
      messageMap[peerKnownState.id] = { knownMessage: emptyKnownMessage };
      return messageMap;
    }

    const allCoValueSessions = await this.dbClient.getCoValueSessions(
      coValueRow.rowID,
    );

    const newCoValueKnownState: CojsonInternalTypes.CoValueKnownState = {
      id: coValueRow.id,
      header: true,
      sessions: {},
    };

    const newContentMessages: CojsonInternalTypes.NewContentMessage[] = [
      {
        action: "content",
        id: coValueRow.id,
        header: coValueRow.header,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(coValueRow.header),
      },
    ];

    await Promise.all(
      allCoValueSessions.map((sessionRow) => {
        newCoValueKnownState.sessions[sessionRow.sessionID] =
          sessionRow.lastIdx;
        // Collect new sessions data into newContentMessages
        return this.handleSessionUpdate({
          sessionRow,
          peerKnownState,
          newContentMessages,
        });
      }),
    );

    this.loadedCoValues.add(coValueRow.id);

    const dependedOnCoValuesList = getDependedOnCoValues({
      coValueRow,
      newContentMessages,
    });

    const knownMessage: KnownStateMessage = {
      action: "known",
      ...newCoValueKnownState,
    };
    if (asDependencyOf) {
      knownMessage.asDependencyOf = asDependencyOf;
    }
    messageMap[newCoValueKnownState.id] = {
      knownMessage: knownMessage,
      contentMessages: newContentMessages,
    };

    await Promise.all(
      dependedOnCoValuesList.map((dependedOnCoValue) => {
        if (this.loadedCoValues.has(dependedOnCoValue)) {
          return;
        }

        return this.collectCoValueData(
          {
            id: dependedOnCoValue,
            header: false,
            sessions: {},
          },
          messageMap,
          asDependencyOf || coValueRow.id,
        );
      }),
    );

    return messageMap;
  }

  handleLoad(msg: CojsonInternalTypes.LoadMessage) {
    return this.sendNewContent(msg);
  }

  async handleContent(msg: CojsonInternalTypes.NewContentMessage) {
    const coValueRow = await this.dbClient.getCoValue(msg.id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      return this.sendStateMessage({
        action: "known",
        id: msg.id,
        header: false,
        sessions: {},
        isCorrection: true,
      });
    }

    const storedCoValueRowID: number = coValueRow
      ? coValueRow.rowID
      : await this.dbClient.addCoValue(msg);

    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
      id: msg.id,
      header: true,
      sessions: {},
    };

    let invalidAssumptions = false;

    for (const sessionID of Object.keys(msg.new) as SessionID[]) {
      await this.dbClient.transaction(async () => {
        const sessionRow = await this.dbClient.getSingleCoValueSession(
          storedCoValueRowID,
          sessionID,
        );

        if (sessionRow) {
          ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        }

        if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
          invalidAssumptions = true;
        } else {
          const newLastIdx = await this.putNewTxs(
            msg,
            sessionID,
            sessionRow,
            storedCoValueRowID,
          );
          ourKnown.sessions[sessionID] = newLastIdx;
        }
      });
    }

    if (invalidAssumptions) {
      this.sendStateMessage({
        action: "known",
        ...ourKnown,
        isCorrection: invalidAssumptions,
      });
    } else {
      this.sendStateMessage({
        action: "known",
        ...ourKnown,
      });
    }
  }

  private async putNewTxs(
    msg: CojsonInternalTypes.NewContentMessage,
    sessionID: SessionID,
    sessionRow: StoredSessionRow | undefined,
    storedCoValueRowID: number,
  ) {
    const newTransactions = msg.new[sessionID]?.newTransactions || [];

    const actuallyNewOffset =
      (sessionRow?.lastIdx || 0) - (msg.new[sessionID]?.after || 0);

    const actuallyNewTransactions = newTransactions.slice(actuallyNewOffset);

    let newBytesSinceLastSignature =
      (sessionRow?.bytesSinceLastSignature || 0) +
      actuallyNewTransactions.reduce(
        (sum, tx) =>
          sum +
          (tx.privacy === "private"
            ? tx.encryptedChanges.length
            : tx.changes.length),
        0,
      );

    const newLastIdx =
      (sessionRow?.lastIdx || 0) + actuallyNewTransactions.length;

    let shouldWriteSignature = false;

    if (newBytesSinceLastSignature > MAX_RECOMMENDED_TX_SIZE) {
      shouldWriteSignature = true;
      newBytesSinceLastSignature = 0;
    }

    const nextIdx = sessionRow?.lastIdx || 0;

    if (!msg.new[sessionID]) throw new Error("Session ID not found");

    const sessionUpdate = {
      coValue: storedCoValueRowID,
      sessionID,
      lastIdx: newLastIdx,
      lastSignature: msg.new[sessionID].lastSignature,
      bytesSinceLastSignature: newBytesSinceLastSignature,
    };

    const sessionRowID: number = await this.dbClient.addSessionUpdate({
      sessionUpdate,
      sessionRow,
    });

    if (shouldWriteSignature) {
      await this.dbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID].lastSignature,
      });
    }

    await Promise.all(
      actuallyNewTransactions.map((newTransaction, i) =>
        this.dbClient.addTransaction(sessionRowID, nextIdx + i, newTransaction),
      ),
    );

    return newLastIdx;
  }

  handleKnown(_msg: CojsonInternalTypes.KnownStateMessage) {
    // We don't intend to use the storage (SQLite,IDB,etc.) itself as a synchronisation mechanism, so we can ignore the known messages
  }

  handleDone(_msg: CojsonInternalTypes.DoneMessage) {}

  async sendStateMessage(
    msg:
      | CojsonInternalTypes.KnownStateMessage
      | CojsonInternalTypes.NewContentMessage,
  ): Promise<unknown> {
    return this.toLocalNode.push(msg).catch((e) =>
      logger.error(`Error sending ${msg.action} state, id ${msg.id}`, {
        err: e,
      }),
    );
  }
}
