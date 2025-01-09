import { AgentSecret } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";

type StorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
};

const STORAGE_KEY = "jazz-logged-in-secret";

/**
 * `BrowserOnboardingAuth` provides a `JazzAuth` object for demo authentication.
 *
 * Demo authentication is useful for quickly testing your app, as it allows you to create new accounts and log in as existing ones. The authentication persists across page reloads, with the credentials stored in `localStorage`.
 *
 * ```
 * import { BrowserOnboardingAuth } from "jazz-browser";
 *
 * const auth = new BrowserOnboardingAuth(driver);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserOnboardingAuth implements AuthMethod {
  constructor(
    public defaultUserName: string,
    public driver: BrowserOnboardingAuth.Driver,
  ) {}

  /**
   * @returns A `JazzAuth` object
   */
  async start() {
    const existingUser = localStorage[STORAGE_KEY];

    if (existingUser) {
      const existingUserData = JSON.parse(existingUser) as StorageData;

      const accountID = existingUserData.accountID as ID<Account>;
      const secret = existingUserData.accountSecret;

      return {
        type: "existing",
        credentials: { accountID, secret },
        onSuccess: () => {
          this.driver.onSignedIn({ logOut });
        },
        onError: (error: string | Error) => {
          this.driver.onError(error);
        },
        logOut,
      } satisfies AuthResult;
    } else {
      return {
        type: "new",
        creationProps: { name: this.defaultUserName, anonymous: true },
        saveCredentials: async (credentials: {
          accountID: ID<Account>;
          secret: AgentSecret;
        }) => {
          const storageData = JSON.stringify({
            accountID: credentials.accountID,
            accountSecret: credentials.secret,
          } satisfies StorageData);

          localStorage[STORAGE_KEY] = storageData;
        },
        onSuccess: () => {
          this.driver.onSignedIn({ logOut });
        },
        onError: (error: string | Error) => {
          this.driver.onError(error);
        },
        logOut,
      } satisfies AuthResult;
    }
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserOnboardingAuth {
  export interface Driver {
    onSignedIn: (next: { logOut: () => void }) => void;
    onError: (error: string | Error) => void;
  }
}

function logOut() {
  delete localStorage[STORAGE_KEY];
}
