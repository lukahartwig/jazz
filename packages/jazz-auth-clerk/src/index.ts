import { AgentSecret } from "cojson";
import { AuthSecretStorage } from "jazz-tools";
import {
  Account,
  AuthCredentials,
  AuthenticateAccountFunction,
  ID,
} from "jazz-tools";
import { getClerkUsername } from "./getClerkUsername.js";
import { MinimalClerkClient } from "./types.js";

type ClerkCredentials = {
  jazzAccountID: ID<Account>;
  jazzAccountSecret: AgentSecret;
  jazzAccountSeed?: number[];
};

export type { MinimalClerkClient };

export class JazzClerkAuth {
  constructor(
    private authenticate: AuthenticateAccountFunction,
    private authSecretStorage: AuthSecretStorage,
  ) {}

  /**
   * Loads the Jazz auth data from the Clerk user and sets it in the auth secret storage.
   */
  private loadClerkAuthData = (credentials: ClerkCredentials) => {
    return this.authSecretStorage.set({
      accountID: credentials.jazzAccountID,
      accountSecret: credentials.jazzAccountSecret,
      secretSeed: credentials.jazzAccountSeed
        ? Uint8Array.from(credentials.jazzAccountSeed)
        : undefined,
      provider: "clerk",
    });
  };

  onClerkUserChange = async (clerkClient: Pick<MinimalClerkClient, "user">) => {
    if (!clerkClient.user) {
      await this.authSecretStorage.clear();
      return;
    }

    const isAuthenticated = this.authSecretStorage.isAuthenticated;

    if (isAuthenticated) return;

    const clerkCredentials = clerkClient.user
      .unsafeMetadata as ClerkCredentials;

    if (!clerkCredentials.jazzAccountID) {
      await this.signIn(clerkClient);
    } else {
      await this.logIn(clerkClient);
    }
  };

  logIn = async (clerkClient: Pick<MinimalClerkClient, "user">) => {
    if (!clerkClient.user) {
      throw new Error("Not signed in on Clerk");
    }

    const clerkCredentials = clerkClient.user
      .unsafeMetadata as ClerkCredentials;

    if (
      !clerkCredentials.jazzAccountID ||
      !clerkCredentials.jazzAccountSecret
    ) {
      throw new Error("No credentials found on Clerk");
    }

    const credentials = {
      accountID: clerkCredentials.jazzAccountID,
      accountSecret: clerkCredentials.jazzAccountSecret,
      secretSeed: clerkCredentials.jazzAccountSeed
        ? Uint8Array.from(clerkCredentials.jazzAccountSeed)
        : undefined,
      provider: "clerk",
    } satisfies AuthCredentials;

    await this.authenticate(credentials);

    await this.authSecretStorage.set(credentials);
  };

  signIn = async (clerkClient: Pick<MinimalClerkClient, "user">) => {
    const credentials = await this.authSecretStorage.get();

    if (!credentials) {
      throw new Error("No credentials found");
    }

    const jazzAccountSeed = credentials.secretSeed
      ? Array.from(credentials.secretSeed)
      : undefined;

    await clerkClient.user?.update({
      unsafeMetadata: {
        jazzAccountID: credentials.accountID,
        jazzAccountSecret: credentials.accountSecret,
        jazzAccountSeed,
      } satisfies ClerkCredentials,
    });

    const currentAccount = await Account.getMe().ensureLoaded({
      profile: {},
    });

    const username = getClerkUsername(clerkClient);

    if (username) {
      currentAccount.profile.name = username;
    }

    await this.loadClerkAuthData({
      jazzAccountID: credentials.accountID,
      jazzAccountSecret: credentials.accountSecret,
      jazzAccountSeed,
    });
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserClerkAuth {
  export interface Driver {
    onError: (error: string | Error) => void;
  }
}
