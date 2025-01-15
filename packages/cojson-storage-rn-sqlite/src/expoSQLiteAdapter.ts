import { SQLResult, SQLRow, SQLiteAdapter } from "./sqliteAdapter.js";

interface SQLiteTransaction {
  executeSql(
    sql: string,
    params: any[],
    success: (tx: SQLiteTransaction, result: SQLiteResultSet) => void,
    error: (tx: SQLiteTransaction, error: Error) => boolean,
  ): void;
}

interface SQLiteResultSet {
  rows: {
    length: number;
    item(index: number): any;
  };
  insertId?: number;
  rowsAffected: number;
}

export class ExpoSQLiteAdapter implements SQLiteAdapter {
  private db: any;
  private dbName: string;
  private SQLite: typeof import("expo-sqlite") | null = null;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  private async ensureInitialized() {
    if (!this.SQLite) {
      try {
        this.SQLite = await import("expo-sqlite");
        this.db = this.SQLite.openDatabase(this.dbName);
      } catch (e) {
        throw new Error(
          "expo-sqlite is not installed. Please install it to use ExpoSQLiteAdapter.",
        );
      }
    }
  }

  private async executeSql(
    sql: string,
    params?: unknown[],
  ): Promise<SQLResult> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: SQLiteTransaction) => {
        tx.executeSql(
          sql,
          params as any[],
          (_: SQLiteTransaction, result: SQLiteResultSet) => {
            resolve({
              rows: [...Array(result.rows.length)].map((_, i) =>
                result.rows.item(i),
              ) as SQLRow[],
              insertId: result.insertId,
              rowsAffected: result.rowsAffected,
            });
          },
          (_: SQLiteTransaction, error: Error) => {
            reject(error);
            return false;
          },
        );
      });
    });
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();

    // Note: WAL mode is not supported in expo-sqlite
    const { rows } = await this.executeSql("PRAGMA user_version");
    const oldVersion = Number(rows[0]?.user_version) ?? 0;

    if (oldVersion === 0) {
      await this.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          ses INTEGER,
          idx INTEGER,
          tx TEXT NOT NULL,
          PRIMARY KEY (ses, idx)
        ) WITHOUT ROWID;`,
      );

      await this.executeSql(
        `CREATE TABLE IF NOT EXISTS sessions (
          rowID INTEGER PRIMARY KEY,
          coValue INTEGER NOT NULL,
          sessionID TEXT NOT NULL,
          lastIdx INTEGER,
          lastSignature TEXT,
          UNIQUE (sessionID, coValue)
        );`,
      );

      await this.executeSql(
        `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`,
      );

      await this.executeSql(
        `CREATE TABLE IF NOT EXISTS coValues (
          rowID INTEGER PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          header TEXT NOT NULL UNIQUE
        );`,
      );

      await this.executeSql(
        `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`,
      );

      await this.executeSql("PRAGMA user_version = 1");
    }

    if (oldVersion <= 2) {
      await this.executeSql(
        `CREATE TABLE IF NOT EXISTS signatureAfter (
          ses INTEGER,
          idx INTEGER,
          signature TEXT NOT NULL,
          PRIMARY KEY (ses, idx)
        ) WITHOUT ROWID;`,
      );

      await this.executeSql(
        `ALTER TABLE sessions ADD COLUMN bytesSinceLastSignature INTEGER;`,
      );

      await this.executeSql("PRAGMA user_version = 3");
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<SQLResult> {
    await this.ensureInitialized();
    return this.executeSql(sql, params);
  }

  executeSync(sql: string, params?: unknown[]): { rows: SQLRow[] } {
    throw new Error("Synchronous execution is not supported by expo-sqlite");
  }

  async transaction(callback: () => Promise<void>): Promise<void> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.db.transaction(
        async (tx: SQLiteTransaction) => {
          try {
            await callback();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        reject,
        resolve,
      );
    });
  }
}
