import {
  AgentSecret,
  CoID,
  ControlledAgent,
  CryptoProvider,
  LocalNode,
  Peer,
  RawAccount,
  RawAccountID,
  SessionID,
} from "cojson";
import { type Account, type AccountClass } from "../coValues/account.js";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import type { ID } from "../internal.js";
import { activeAccountContext } from "./activeAccountContext.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";

export async function randomSessionProvider(
  accountID: ID<Account>,
  crypto: CryptoProvider,
) {
  return {
    sessionID: crypto.newRandomSessionID(accountID as unknown as RawAccountID),
    sessionDone: () => { },
  };
}

export type SessionProvider = (
  accountID: ID<Account>,
  crypto: CryptoProvider,
) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;

export type CreationProps = { name: string }

export type ContextParams<Acc extends Account> = {
  AccountSchema?: AccountClass<Acc>;
  guestMode?: boolean;
  sessionProvider: SessionProvider;
  peersToLoadFrom?: Peer[];
  crypto: CryptoProvider;
  storage: AuthSecretStorage;
};

export type JazzContextWithAccount<Acc extends Account> = {
  account: Acc;
  node: LocalNode;
  done: () => void;
  logOut: () => void;
};

export type JazzContextWithAgent = {
  agent: AnonymousJazzAgent;
  node: LocalNode;
  done: () => void;
  logOut: () => void;
};

export type JazzContext<Acc extends Account> =
  | JazzContextWithAccount<Acc>
  | JazzContextWithAgent;

export class JazzContextManager<Acc extends Account> {
  private context: JazzContext<Acc> | JazzContextWithAgent | null = null;
  public crypto: CryptoProvider;
  private sessionProvider: (
    accountID: ID<Account>,
    crypto: CryptoProvider,
  ) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;
  private peersToLoadFrom: Peer[];
  private AccountSchema?: AccountClass<Acc> | undefined;
  private storage: AuthSecretStorage;

  constructor(
    options: ContextParams<Acc>,
  ) {
    this.crypto = options.crypto;
    this.sessionProvider = options.sessionProvider;
    this.peersToLoadFrom = options.peersToLoadFrom ?? [];
    this.AccountSchema = options.AccountSchema;
    this.storage = options.storage;
  }

  public async logInAsGuest() {
    this.context?.done();
    this.context = await createAnonymousJazzContext({
      peersToLoadFrom: this.peersToLoadFrom,
      crypto: this.crypto,
    });
    this.notify();
  }

  public async logIn(credentials: AuthCredentials) {
    this.context?.done();
    this.context = await createJazzContextWithLoadedAccount({
      sessionProvider: this.sessionProvider,
      peersToLoadFrom: this.peersToLoadFrom,
      crypto: this.crypto,
      AccountSchema: this.AccountSchema,
      credentials,
    });
    await this.storage.set(credentials);
    this.notify();
  }

  public async registerNewAccount(credentials: CreationAuthCredentials, creationProps: CreationProps) {
    this.context?.done();
    const context = await createJazzContextWithNewAccount({
      sessionProvider: this.sessionProvider,
      peersToLoadFrom: this.peersToLoadFrom,
      crypto: this.crypto,
      AccountSchema: this.AccountSchema,
      credentials,
      creationProps,
    });
    this.context = context;
    const accountID = context.account.id;
    await this.storage.set({
      accountID,
      secretSeed: credentials.secretSeed,
      accountSecret: credentials.accountSecret,
      isAnonymous: credentials.isAnonymous,
    });
    this.notify();
    return context;
  }

  public async trackAuthUpgrade() {
    const currentCredentials = await this.storage.get();

    if (!currentCredentials) {
      throw new Error("No credentials found");
    }

    await this.storage.set({
      ...currentCredentials,
      isAnonymous: false,
    });
  }

  getCredentials() {
    return this.storage.get();
  }

  getCurrentContext() {
    return this.context;
  }

  listeners = new Set<() => void>();
  subscribe(callback: () => void) {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  addPeer(peer: Peer) {
    this.context?.node.syncManager.addPeer(peer);
    this.peersToLoadFrom.push(peer);
  }

  removePeer(peer: Peer) {
    this.peersToLoadFrom = this.peersToLoadFrom.filter((p) => p !== peer);
  }

  logOut() {
    this.context?.logOut();
    this.context = null;
    this.storage.clear();
    this.notify();
  }
}

async function createJazzContextWithLoadedAccount<Acc extends Account>(
  options: {
    sessionProvider: SessionProvider;
    peersToLoadFrom: Peer[];
    crypto: CryptoProvider;
    AccountSchema?: AccountClass<Acc>;
    credentials: AuthCredentials;
  },
) {
  const {
    sessionProvider,
    peersToLoadFrom,
    crypto,
    credentials,
  } = options;
  const AccountSchema =
    options.AccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const { sessionID, sessionDone } = await sessionProvider(
    credentials.accountID,
    crypto,
  );

  if (!peersToLoadFrom || peersToLoadFrom.length === 0) {
    throw new Error("Peers are required to load an account");
  }

  const node = await LocalNode.withLoadedAccount({
    accountID: credentials.accountID as unknown as CoID<RawAccount>,
    accountSecret: credentials.accountSecret,
    sessionID: sessionID,
    peersToLoadFrom,
    crypto: crypto,
    migration: async (rawAccount, _node, creationProps) => {
      const account = new AccountSchema({
        fromRaw: rawAccount,
      }) as Acc;

      activeAccountContext.set(account);

      await account.applyMigration(creationProps);
    },
  });

  const account = AccountSchema.fromNode(node);
  activeAccountContext.set(account);

  return {
    account,
    node,
    done: () => {
      node.gracefulShutdown();
      sessionDone();
    },
    logOut: () => {
      node.gracefulShutdown();
      sessionDone();
    },
  }
}

async function createJazzContextWithNewAccount<Acc extends Account>(
  options: {
    sessionProvider: SessionProvider;
    peersToLoadFrom: Peer[];
    crypto: CryptoProvider;
    AccountSchema?: AccountClass<Acc>;
    creationProps: CreationProps;
    credentials: CreationAuthCredentials;
  },
) {
  const {
    peersToLoadFrom,
    crypto,
    creationProps,
    credentials,
  } = options;
  const AccountSchema =
    options.AccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const { node } = await LocalNode.withNewlyCreatedAccount({
    creationProps,
    peersToLoadFrom,
    crypto: crypto,
    initialAgentSecret: credentials.accountSecret,
    migration: async (rawAccount, _node, creationProps) => {
      const account = new AccountSchema({
        fromRaw: rawAccount,
      }) as Acc;
      activeAccountContext.set(account);

      await account.applyMigration(creationProps);
    },
  });

  const account = AccountSchema.fromNode(node);
  activeAccountContext.set(account);

  return {
    account,
    node,
    done: () => {
      node.gracefulShutdown();
    },
    logOut: () => {
      node.gracefulShutdown();
    },
  };
}

export async function createAnonymousJazzContext({
  peersToLoadFrom,
  crypto,
}: {
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
}): Promise<JazzContextWithAgent> {
  const agentSecret = crypto.newRandomAgentSecret();
  const rawAgent = new ControlledAgent(agentSecret, crypto);

  const node = new LocalNode(
    rawAgent,
    crypto.newRandomSessionID(rawAgent.id),
    crypto,
  );

  for (const peer of peersToLoadFrom) {
    node.syncManager.addPeer(peer);
  }

  activeAccountContext.setGuestMode();

  return {
    agent: new AnonymousJazzAgent(node),
    node,
    done: () => { },
    logOut: () => { },
  };
}

export type CreationAuthCredentials =
  | {
    secretSeed?: Uint8Array;
    accountSecret: AgentSecret;
    isAnonymous?: boolean;
  };

export type AuthCredentials =
  | {
    accountID: ID<Account>;
    secretSeed?: Uint8Array;
    accountSecret: AgentSecret;
    isAnonymous: boolean;
  };

export type AuthSetPayload =
  | {
    accountID: ID<Account>;
    secretSeed?: Uint8Array;
    accountSecret: AgentSecret;
    isAnonymous?: boolean;
    authProvider?: string;
  };

export interface AuthSecretStorage {
  migrate(): Promise<void>;
  get(): Promise<AuthCredentials | null>;
  set(payload: AuthSetPayload): Promise<void>;

  isAnonymous(): Promise<boolean>;

  onUpdate(handler: () => void): () => void;
  emitUpdate(): void;

  clear(): Promise<void>;
}
