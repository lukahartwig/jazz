import { CoValueHeader, Transaction } from "./coValueCore.js";
import { Signature } from "./crypto/crypto.js";
import {
  CoValueCore,
  LocalNode,
  RawCoID,
  SessionID,
  logger,
} from "./exports.js";
import { CoValueKnownState, SessionNewContent } from "./sync.js";

export type StoredSessionLog = {
  transactions: Transaction[];
  signatureAfter: { [txIdx: number]: Signature | undefined };
  lastSignature: Signature;
};

export interface StorageAdapter {
  get(id: RawCoID): Promise<{
    header: CoValueHeader;
    sessions: Map<SessionID, StoredSessionLog>;
  } | null>;

  writeHeader(id: RawCoID, header: CoValueHeader): Promise<void>;

  appendToSession(
    id: RawCoID,
    sessionID: SessionID,
    afterIdx: number,
    tx: Transaction[],
    lastSignature: Signature,
  ): Promise<void>;
}

export class StorageDriver {
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
        core
          .tryAddTransactions(
            sessionID,
            sessionLog.transactions.slice(start, parseInt(signatureAt)),
            undefined,
            signature,
            { skipStorage: true },
          )
          ._unsafeUnwrap();
      }
    }

    this.storedStates.set(id, core.knownState());

    return core;
  }

  pullFrom = new Set<RawCoID>();
  updating = new Set<RawCoID>();

  set(core: CoValueCore) {
    this.pullFrom.add(core.id);

    if (!this.updating.has(core.id)) {
      this.updating.add(core.id);
      void this.pullNewTransactions(core);
    }
  }

  async pullNewTransactions(core: CoValueCore) {
    while (this.pullFrom.has(core.id)) {
      this.pullFrom.delete(core.id);
      try {
        await this.update(core);
      } catch (e) {
        logger.error(`Error updating ${core.id}`, {
          error: e instanceof Error ? e.message : String(e),
          stack: (e instanceof Error ? e.stack : undefined) ?? null,
        });
      }
    }

    this.updating.delete(core.id);
  }

  async update(core: CoValueCore): Promise<void> {
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
      const entries = Object.entries(piece.new) as [
        keyof typeof piece.new,
        SessionNewContent,
      ][];

      await Promise.all(
        entries.map(async ([sessionID, sessionNewContent]) => {
          await this.storageAdapter.appendToSession(
            core.id,
            sessionID,
            sessionNewContent.after,
            sessionNewContent.newTransactions,
            sessionNewContent.lastSignature,
          );
        }),
      );
    }

    this.storedStates.set(core.id, knownState);
  }
}
