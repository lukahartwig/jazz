import { SQLResult, SQLRow, SQLiteAdapter } from "./sqliteAdapter.js";

type OPSQLiteModule = typeof import("@op-engineering/op-sqlite");

export class OPSQLiteAdapter implements SQLiteAdapter {
  private db: any;
  private dbName: string;
  private opSQLite: OPSQLiteModule | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  private async ensureInitialized() {
    // Return immediately if already initialized
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // Start initialization
    this.initializationPromise = this.initializeInternal();
    try {
      await this.initializationPromise;
      this.isInitialized = true;
    } catch (error) {
      // Clear the promise on failure so future attempts can retry
      this.initializationPromise = null;
      throw error;
    }
  }

  private async initializeInternal() {
    if (!this.opSQLite) {
      try {
        this.opSQLite = await import("@op-engineering/op-sqlite");
        this.db = this.opSQLite.open({ name: this.dbName });
      } catch (e) {
        throw new Error(
          "@op-engineering/op-sqlite is not installed. Please install it to use OPSQLiteAdapter.",
        );
      }
    }

    await this.execute("PRAGMA journal_mode=WAL");
    const { rows } = await this.execute("PRAGMA user_version");
    const oldVersion = Number(rows[0]?.user_version) ?? 0;

    if (oldVersion === 0) {
      await this.execute(
        `CREATE TABLE IF NOT EXISTS transactions (
          ses INTEGER,
          idx INTEGER,
          tx TEXT NOT NULL,
          PRIMARY KEY (ses, idx)
        ) WITHOUT ROWID;`,
      );

      await this.execute(
        `CREATE TABLE IF NOT EXISTS sessions (
          rowID INTEGER PRIMARY KEY,
          coValue INTEGER NOT NULL,
          sessionID TEXT NOT NULL,
          lastIdx INTEGER,
          lastSignature TEXT,
          UNIQUE (sessionID, coValue)
        );`,
      );

      await this.execute(
        `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`,
      );

      await this.execute(
        `CREATE TABLE IF NOT EXISTS coValues (
          rowID INTEGER PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          header TEXT NOT NULL UNIQUE
        );`,
      );

      await this.execute(
        `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`,
      );

      await this.execute("PRAGMA user_version = 1");
    }

    if (oldVersion <= 2) {
      await this.execute(
        `CREATE TABLE IF NOT EXISTS signatureAfter (
          ses INTEGER,
          idx INTEGER,
          signature TEXT NOT NULL,
          PRIMARY KEY (ses, idx)
        ) WITHOUT ROWID;`,
      );

      await this.execute(
        `ALTER TABLE sessions ADD COLUMN bytesSinceLastSignature INTEGER;`,
      );

      await this.execute("PRAGMA user_version = 3");
    }
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  async execute(sql: string, params?: unknown[]): Promise<SQLResult> {
    if (!this.db) {
      await this.ensureInitialized();
    }
    const result = await this.db.execute(sql, params as any[]);
    return {
      rows: result.rows as SQLRow[],
      insertId:
        result.rowsAffected > 0 ? (result.rows[0]?.rowid as number) : undefined,
      rowsAffected: result.rowsAffected,
    };
  }

  executeSync(sql: string, params?: unknown[]): { rows: SQLRow[] } {
    if (!this.isInitialized || !this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    const result = this.db.executeSync(sql, params as any[]);
    return {
      rows: result.rows as SQLRow[],
    };
  }

  async transaction(callback: () => Promise<void>): Promise<void> {
    if (!this.db) {
      await this.ensureInitialized();
    }
    await this.db.transaction(callback);
  }
}
