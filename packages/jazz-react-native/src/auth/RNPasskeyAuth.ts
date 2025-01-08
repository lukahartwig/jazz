import {
  AgentSecret,
  CryptoProvider,
  RawAccountID,
  cojsonInternals,
} from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";
import { KvStore } from "../storage/kv-store-context.js";
import type { PasskeyWebView } from "./PasskeyWebView.ts";

interface Credentials {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
}

const LOCAL_STORAGE_KEY = "passkey-auth-credentials";

export namespace RNPasskeyAuth {
  export interface Driver {
    onReady: (callbacks: {
      signUp: (username: string) => Promise<void>;
      logIn: () => Promise<void>;
    }) => void;
    onSignedIn: (callbacks: { logOut: () => void }) => void;
    onError: (error: string | Error) => void;
  }
}

export class RNPasskeyAuth implements AuthMethod {
  constructor(
    private driver: RNPasskeyAuth.Driver,
    private webViewRef: React.RefObject<PasskeyWebView>,
    private appName: string,
    private appHostname: string,
    private kvStore: KvStore,
  ) {}

  async start(crypto: CryptoProvider): Promise<AuthResult> {
    // 1. Check if we already have stored credentials
    const stored = await this.kvStore.get(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Credentials;
        return this.buildExistingAuthResult(parsed);
      } catch (err) {
        console.error("Error parsing stored credentials:", err);
        await this.kvStore.delete(LOCAL_STORAGE_KEY);
      }
    }

    // 2. If no stored credentials, wait for user signup or login
    return new Promise<AuthResult>((resolve) => {
      this.driver.onReady({
        signUp: async (username: string) => {
          const secretSeed = crypto.newRandomSecretSeed();

          // We'll return an AuthResult of type "new"
          const result: AuthResult = {
            type: "new",
            creationProps: { name: username },
            initialSecret: crypto.agentSecretFromSecretSeed(secretSeed),
            saveCredentials: async ({ accountID, secret }) => {
              // Prepare a credential "payload" to pass to WebAuthn
              // This includes the raw accountID bytes appended to secretSeed
              const webAuthNCredentialPayload = new Uint8Array(
                cojsonInternals.secretSeedLength +
                  cojsonInternals.shortHashLength,
              );
              webAuthNCredentialPayload.set(secretSeed);
              webAuthNCredentialPayload.set(
                cojsonInternals.rawCoIDtoBytes(
                  accountID as unknown as RawAccountID,
                ),
                cojsonInternals.secretSeedLength,
              );

              // Construct the publicKey creation options
              const publicKeyCreateOptions = {
                challenge: new Uint8Array([0x01, 0x02]),
                rp: {
                  name: this.appName,
                  id: this.appHostname,
                },
                user: {
                  id: webAuthNCredentialPayload,
                  name: username + ` (${new Date().toLocaleString()})`,
                  displayName: username,
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: {
                  authenticatorAttachment: "platform",
                  requireResidentKey: true,
                  residentKey: "required",
                },
                attestation: "direct",
                timeout: 60000,
              };

              // Kick off "create" flow in the WebView
              const operationResult = await this.runPasskeyOperation(
                "create",
                publicKeyCreateOptions,
              );

              // Store accountID & secret
              const credentialsToStore: Credentials = {
                accountID: accountID,
                accountSecret: secret,
              };
              await this.kvStore.set(
                LOCAL_STORAGE_KEY,
                JSON.stringify(credentialsToStore),
              );
            },
            onSuccess: () => {
              // Notify driver that we have successfully signed in
              this.driver.onSignedIn({ logOut: this.logOut });
            },
            onError: (e: string | Error) => {
              this.driver.onError(e);
            },
            logOut: this.logOut,
          };

          // Resolve the AuthResult so Jazz can continue
          resolve(result);
        },

        logIn: async () => {
          const result: AuthResult = {
            type: "existing",
            credentials: {
              accountID: "placeholder" as ID<Account>,
              secret: "placeholder" as AgentSecret,
            },
            onSuccess: () => {
              this.driver.onSignedIn({ logOut: this.logOut });
            },
            onError: (e: string | Error) => {
              this.driver.onError(e);
            },
            logOut: this.logOut,
            saveCredentials: async ({ accountID, secret }) => {
              const credentialsToStore: Credentials = {
                accountID,
                accountSecret: secret,
              };
              await this.kvStore.set(
                LOCAL_STORAGE_KEY,
                JSON.stringify(credentialsToStore),
              );
            },
          };

          // Start "get" flow in the WebView
          const publicKeyGetOptions = {
            challenge: new Uint8Array([0x01, 0x02]),
            rpId: this.appHostname,
            allowCredentials: [], // or fill in allowed credential IDs
            timeout: 60000,
          };
          try {
            const operationResult = await this.runPasskeyOperation(
              "get",
              publicKeyGetOptions,
            );
            // Parse operationResult to build credentials if needed
          } catch (error) {
            this.driver.onError(error as Error);
          }

          resolve(result);
        },
      });
    });
  }

  private async runPasskeyOperation(
    operation: "create" | "get",
    options: unknown,
  ) {
    if (!this.webViewRef.current) {
      throw new Error("WebView reference not set");
    }

    // The WebView component now handles the message callbacks internally
    return this.webViewRef.current.executeOperation(operation, options);
  }

  private buildExistingAuthResult(credentials: Credentials): AuthResult {
    return {
      type: "existing",
      credentials: {
        accountID: credentials.accountID,
        secret: credentials.accountSecret,
      },
      onSuccess: () => {
        this.driver.onSignedIn({ logOut: this.logOut });
      },
      onError: (error) => {
        this.driver.onError(error);
      },
      logOut: this.logOut,
    };
  }

  private logOut = async () => {
    await this.kvStore.delete(LOCAL_STORAGE_KEY);
  };
}
