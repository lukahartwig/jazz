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
import { AuthSecretStorage } from "../auth/AuthSecretStorage.js";
import { type Account, type AccountClass } from "../coValues/account.js";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import type { ID } from "../internal.js";
import { AuthCredentials, NewAccountProps } from "../types.js";
import { activeAccountContext } from "./activeAccountContext.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";

export type Credentials = {
  accountID: ID<Account>;
  secret: AgentSecret;
};

type SessionProvider = (
  accountID: ID<Account>,
  crypto: CryptoProvider,
) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;

export type AuthResult =
  | {
      type: "existing";
      username?: string;
      credentials: Credentials;
      saveCredentials?: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => Promise<void>;
    }
  | {
      type: "new";
      creationProps: {
        name: string;
        anonymous?: boolean;
        other?: Record<string, unknown>;
      };
      initialSecret?: AgentSecret;
      saveCredentials: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => Promise<void>;
    };

export async function randomSessionProvider(
  accountID: ID<Account>,
  crypto: CryptoProvider,
) {
  return {
    sessionID: crypto.newRandomSessionID(accountID as unknown as RawAccountID),
    sessionDone: () => {},
  };
}

export type JazzContextWithAccount<Acc extends Account> = {
  node: LocalNode;
  account: Acc;
  done: () => void;
  logOut: () => Promise<void>;
};

export type JazzContextWithAgent = {
  agent: AnonymousJazzAgent;
  done: () => void;
  logOut: () => Promise<void>;
};

export type JazzContext<Acc extends Account> =
  | JazzContextWithAccount<Acc>
  | JazzContextWithAgent;

export async function createJazzContextFromExistingCredentials<
  Acc extends Account,
>({
  credentials,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  sessionProvider,
  onLogOut,
}: {
  credentials: Credentials;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: AccountClass<Acc>;
  sessionProvider: SessionProvider;
  onLogOut?: () => void;
}): Promise<JazzContextWithAccount<Acc>> {
  const { sessionID, sessionDone } = await sessionProvider(
    credentials.accountID,
    crypto,
  );

  const CurrentAccountSchema =
    PropsAccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const node = await LocalNode.withLoadedAccount({
    accountID: credentials.accountID as unknown as CoID<RawAccount>,
    accountSecret: credentials.secret,
    sessionID: sessionID,
    peersToLoadFrom: peersToLoadFrom,
    crypto: crypto,
    migration: async (rawAccount, _node, creationProps) => {
      const account = new CurrentAccountSchema({
        fromRaw: rawAccount,
      }) as Acc;
      activeAccountContext.set(account);

      await account.applyMigration(creationProps);
    },
  });

  const account = CurrentAccountSchema.fromNode(node);
  activeAccountContext.set(account);

  return {
    node,
    account,
    done: () => {
      node.gracefulShutdown();
      sessionDone();
    },
    logOut: async () => {
      node.gracefulShutdown();
      sessionDone();
      await onLogOut?.();
    },
  };
}

export async function createJazzContextForNewAccount<Acc extends Account>({
  creationProps,
  initialAgentSecret,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  onLogOut,
}: {
  creationProps: { name: string };
  initialAgentSecret?: AgentSecret;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: AccountClass<Acc>;
  onLogOut?: () => Promise<void>;
}): Promise<JazzContextWithAccount<Acc>> {
  const CurrentAccountSchema =
    PropsAccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const { node } = await LocalNode.withNewlyCreatedAccount({
    creationProps,
    peersToLoadFrom,
    crypto,
    initialAgentSecret,
    migration: async (rawAccount, _node, creationProps) => {
      const account = new CurrentAccountSchema({
        fromRaw: rawAccount,
      }) as Acc;
      activeAccountContext.set(account);

      await account.applyMigration(creationProps);
    },
  });

  const account = CurrentAccountSchema.fromNode(node);
  activeAccountContext.set(account);

  return {
    node,
    account,
    done: () => {
      node.gracefulShutdown();
    },
    logOut: async () => {
      node.gracefulShutdown();
      await onLogOut?.();
    },
  };
}

export async function createJazzContext<Acc extends Account>(options: {
  credentials?: AuthCredentials;
  newAccountProps?: NewAccountProps;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  defaultProfileName?: string;
  AccountSchema?: AccountClass<Acc>;
  sessionProvider: SessionProvider;
  authSecretStorage: AuthSecretStorage;
}) {
  const crypto = options.crypto;

  let context: JazzContextWithAccount<Acc>;

  const authSecretStorage = options.authSecretStorage;

  await authSecretStorage.migrate();

  const credentials = options.credentials ?? (await authSecretStorage.get());

  if (credentials && !options.newAccountProps) {
    context = await createJazzContextFromExistingCredentials({
      credentials: {
        accountID: credentials.accountID,
        secret: credentials.accountSecret,
      },
      peersToLoadFrom: options.peersToLoadFrom,
      crypto,
      AccountSchema: options.AccountSchema,
      sessionProvider: options.sessionProvider,
      onLogOut: () => {
        authSecretStorage.clearWithoutNotify();
      },
    });
  } else {
    // *** No credentials found, likely post-logout or first visit ***
    // Introduce a small delay to allow the previous session's async
    // cleanup (e.g., gracefulShutdown in LocalNode called via logOut)
    // to potentially complete before creating a new anonymous account.
    // This mitigates race conditions observed with fast transitions.
    await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay

    const secretSeed = options.crypto.newRandomSecretSeed();

    const initialAgentSecret =
      options.newAccountProps?.secret ??
      crypto.agentSecretFromSecretSeed(secretSeed);

    const creationProps = options.newAccountProps?.creationProps ?? {
      name: options.defaultProfileName ?? "Anonymous user",
    };

    context = await createJazzContextForNewAccount({
      creationProps,
      initialAgentSecret,
      peersToLoadFrom: options.peersToLoadFrom,
      crypto,
      AccountSchema: options.AccountSchema,
      onLogOut: async () => {
        await authSecretStorage.clearWithoutNotify();
      },
    });

    if (!options.newAccountProps) {
      await authSecretStorage.setWithoutNotify({
        accountID: context.account.id,
        secretSeed,
        accountSecret: context.node.account.agentSecret,
        provider: "anonymous",
      });
    }
  }

  return {
    ...context,
    authSecretStorage,
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
    done: () => {},
    logOut: async () => {},
  };
}
