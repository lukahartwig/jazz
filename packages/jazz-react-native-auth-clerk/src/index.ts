import { AgentSecret } from "cojson";
import type { KvStore } from "jazz-react-native";
import { Account, AuthMethod, AuthResult, Credentials, ID } from "jazz-tools";

export type MinimalClerkClient = {
  user:
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unsafeMetadata: Record<string, any>;
        fullName: string | null;
        username: string | null;
        firstName: string | null;
        primaryEmailAddress: {
          emailAddress: string;
        } | null;
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

const localStorageKey = "jazz-clerk-auth";

function saveCredentialsToStorage(kvStore: KvStore, credentials: Credentials) {
  kvStore.set(
    localStorageKey,
    JSON.stringify({
      accountID: credentials.accountID,
      secret: credentials.secret,
    }),
  );
}

async function clearStoredCredentials(kvStore: KvStore) {
  await kvStore.delete(localStorageKey);
}

export class ReactNativeClerkAuth implements AuthMethod {
  constructor(
    public driver: ReactNativeClerkAuth.Driver,
    private readonly clerkClient: MinimalClerkClient,
    private readonly kvStore: KvStore,
  ) {}

  async start(): Promise<AuthResult> {
    const locallyStoredCredentials = await this.kvStore.get(localStorageKey);
    if (locallyStoredCredentials && this.clerkClient.user) {
      try {
        const stored = JSON.parse(locallyStoredCredentials);
        const clerkMetadata = this.clerkClient.user.unsafeMetadata;
        if (clerkMetadata.jazzAccountID !== stored.accountID) {
          await clearStoredCredentials(this.kvStore);
        }
      } catch (e) {
        await clearStoredCredentials(this.kvStore);
      }
    }

    const locallyStoredCredentialsAgain =
      await this.kvStore.get(localStorageKey);

    if (locallyStoredCredentialsAgain) {
      try {
        const credentials = JSON.parse(
          locallyStoredCredentialsAgain,
        ) as Credentials;
        return {
          type: "existing",
          credentials,
          saveCredentials: async () => {}, // No need to save credentials when recovering from local storage
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            void clearStoredCredentials(this.kvStore);
            void this.clerkClient.signOut();
          },
        };
      } catch (e) {
        console.error("Error parsing local storage credentials", e);
      }
    }

    if (this.clerkClient.user) {
      // Check clerk user metadata for credentials
      const storedCredentials = this.clerkClient.user.unsafeMetadata;
      if (storedCredentials.jazzAccountID) {
        if (!storedCredentials.jazzAccountSecret) {
          throw new Error("No secret for existing user");
        }
        return {
          type: "existing",
          credentials: {
            accountID: storedCredentials.jazzAccountID as ID<Account>,
            secret: storedCredentials.jazzAccountSecret as AgentSecret,
          },
          saveCredentials: async ({ accountID, secret }: Credentials) => {
            saveCredentialsToStorage(this.kvStore, {
              accountID,
              secret,
            });
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            void clearStoredCredentials(this.kvStore);
            void this.clerkClient.signOut();
          },
        };
      } else {
        // No credentials found, so we need to create new credentials
        return {
          type: "new",
          creationProps: {
            name:
              this.clerkClient.user.fullName ||
              this.clerkClient.user.firstName ||
              this.clerkClient.user.username ||
              this.clerkClient.user.primaryEmailAddress?.emailAddress?.split(
                "@",
              )[0] ||
              this.clerkClient.user.id,
            other: {
              email: this.clerkClient.user.primaryEmailAddress?.emailAddress,
            },
          },
          saveCredentials: async ({ accountID, secret }: Credentials) => {
            saveCredentialsToStorage(this.kvStore, {
              accountID,
              secret,
            });
            await this.clerkClient.user?.update({
              unsafeMetadata: {
                jazzAccountID: accountID,
                jazzAccountSecret: secret,
              },
            });
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            void clearStoredCredentials(this.kvStore);
            void this.clerkClient.signOut();
          },
        };
      }
    } else {
      // Clerk user not found, so we can't authenticate
      throw new Error("Not signed in");
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReactNativeClerkAuth {
  export interface Driver {
    onError: (error: string | Error) => void;
  }
}

////

import { useMemo, useState } from "react";

export function useJazzClerkAuth(clerk: MinimalClerkClient, kvStore: KvStore) {
  const [state, setState] = useState<{ errors: string[] }>({ errors: [] });

  const authMethod = useMemo(() => {
    return new ReactNativeClerkAuth(
      {
        onError: (error) => {
          void clerk.signOut();
          setState((state) => ({
            ...state,
            errors: [...state.errors, error.toString()],
          }));
        },
      },
      clerk,
      kvStore,
    );
  }, [clerk.user]);

  return [authMethod, state] as const;
}
