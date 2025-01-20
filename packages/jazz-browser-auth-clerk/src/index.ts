import { AgentSecret, CryptoProvider } from "cojson";
import { Account, ID, JazzContextManager } from "jazz-tools";

export type MinimalClerkClient = {
  user:
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unsafeMetadata: Record<string, any>;
        fullName: string | null;
        username: string | null;
        id: string;
        update: (args: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unsafeMetadata: Record<string, any>;
        }) => Promise<unknown>;
      }
    | null
    | undefined;
  signOut: () => Promise<void>;
};

type ClerkCredentials = {
  jazzAccountID: ID<Account>;
  jazzAccountSecret: AgentSecret;
  jazzAccountSeed?: number[];
};

export class BrowserClerkAuth {
  constructor(
    private readonly context: JazzContextManager<Account>,
    private readonly clerkClient: MinimalClerkClient,
  ) {}

  async logIn() {
    const clerkCredentials = this.clerkClient.user?.unsafeMetadata as ClerkCredentials;

    if (!clerkCredentials.jazzAccountID || !clerkCredentials.jazzAccountSecret) {
      throw new Error("No credentials found");
    }

    return this.context.logIn({
      accountID: clerkCredentials.jazzAccountID,
      accountSecret: clerkCredentials.jazzAccountSecret,
      secretSeed: clerkCredentials.jazzAccountSeed
        ? Uint8Array.from(clerkCredentials.jazzAccountSeed)
        : undefined,
      isAnonymous: false,
    });
  }

  async registerCredentials() {
    const currentCredentials = await this.context.getCredentials();

    if (!currentCredentials) {
      throw new Error("No credentials found");
    }

    await this.clerkClient.user?.update({
      unsafeMetadata: {
        jazzAccountID: currentCredentials.accountID,
        jazzAccountSecret: currentCredentials.accountSecret,
        jazzAccountSeed: currentCredentials.secretSeed
          ? Array.from(currentCredentials.secretSeed)
          : undefined,
      } satisfies ClerkCredentials,
    });

    await this.context.trackAuthUpgrade();
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserClerkAuth {
  export interface Driver {
    onError: (error: string | Error) => void;
  }
}
