import {  RawAccountID, cojsonInternals } from "cojson";
import { Account, ID, JazzContextManager } from "jazz-tools";

/**
 * `BrowserPasskeyAuth` provides a `JazzAuth` object for passkey authentication.
 *
 * ```ts
 * import { BrowserPasskeyAuth } from "jazz-browser";
 *
 * const auth = new BrowserPasskeyAuth(driver, appName);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserPasskeyAuth {
  constructor(
    private context: JazzContextManager<Account>,
    public appName: string,
    // TODO: is this a safe default?
    public appHostname: string = window.location.hostname,
  ) {}

  async logIn() {
    const webAuthNCredential = await this.getPasskeyCredentials();

    if (!webAuthNCredential) return null;

    const webAuthNCredentialPayload = new Uint8Array(
      webAuthNCredential.response.userHandle,
    );
    const accountSecretSeed = webAuthNCredentialPayload.slice(
      0,
      cojsonInternals.secretSeedLength,
    );

    const accountSecret = this.context.crypto.agentSecretFromSecretSeed(accountSecretSeed);

    const accountID = cojsonInternals.rawCoIDfromBytes(
      webAuthNCredentialPayload.slice(
        cojsonInternals.secretSeedLength,
        cojsonInternals.secretSeedLength +
          cojsonInternals.shortHashLength,
      ),
    ) as ID<Account>;

    return this.context.logIn({
      accountID,
      accountSecret,
      secretSeed: accountSecretSeed,
      isAnonymous: false,
    });
  }

  async registerCredentials(username: string) {
    const credentials = await this.context.getCredentials();

    if (!credentials) {
      throw new Error("No credentials found");
    }

    if (!credentials.secretSeed) {
      throw new Error("No secret seed found");
    }

    await this.createPasskeyCredentials({
      accountID: credentials.accountID,
      secretSeed: credentials.secretSeed,
      username,
    });

    await this.context.trackAuthUpgrade();
  }

  private async createPasskeyCredentials({
    accountID,
    secretSeed,
    username,
  }: {
    accountID: ID<Account>;
    secretSeed: Uint8Array;
    username: string;
  }) {
    const webAuthNCredentialPayload = new Uint8Array(
      cojsonInternals.secretSeedLength + cojsonInternals.shortHashLength,
    );

    webAuthNCredentialPayload.set(secretSeed);
    webAuthNCredentialPayload.set(
      cojsonInternals.rawCoIDtoBytes(accountID as unknown as RawAccountID),
      cojsonInternals.secretSeedLength,
    );

    try {
      await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from([0, 1, 2]),
          rp: {
            name: this.appName,
            id: this.appHostname,
          },
          user: {
            id: webAuthNCredentialPayload,
            name: username + ` (${new Date().toLocaleString()})`,
            displayName: username,
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: true,
            residentKey: "required",
          },
          timeout: 60000,
          attestation: "direct",
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        throw new Error("Passkey creation not allowed");
      }

      throw error;
    }
  }

  private async getPasskeyCredentials() {
    const value = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from([0, 1, 2]),
        rpId: this.appHostname,
        allowCredentials: [],
        timeout: 60000,
      },
    });

    return value as
      | (Credential & { response: { userHandle: ArrayBuffer } })
      | null;
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserPasskeyAuth {
  export interface Driver {
    onReady: (next: {
      signUp: (username: string) => Promise<void>;
      logIn: () => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
    onError: (error: string | Error) => void;
  }
}
