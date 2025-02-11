import * as bip39 from "@scure/bip39";
import { entropyToMnemonic } from "@scure/bip39";
import { CryptoProvider, cojsonInternals } from "cojson";
import { Account } from "../coValues/account.js";
import type { ID } from "../internal.js";
import type { AuthenticateAccountFunction } from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

/**
 * `PassphraseAuth` provides a `JazzAuth` object for passphrase authentication.
 *
 * ```ts
 * import { PassphraseAuth } from "jazz-tools";
 *
 * const auth = new PassphraseAuth(crypto, jazzContext.authenticate, new AuthSecretStorage(), wordlist);
 * ```
 *
 * @category Auth Providers
 */
export class PassphraseAuth {
  passphrase: string = "";

  constructor(
    private crypto: CryptoProvider,
    private authenticate: AuthenticateAccountFunction,
    private authSecretStorage: AuthSecretStorage,
    public wordlist: string[],
  ) {}

  logIn = async (passphrase: string) => {
    const { crypto, authenticate } = this;

    let secretSeed;

    try {
      secretSeed = bip39.mnemonicToEntropy(passphrase, this.wordlist);
    } catch (e) {
      throw new Error("Invalid passphrase");
    }

    const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    const accountID = cojsonInternals.idforHeader(
      cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, crypto),
      crypto,
    ) as ID<Account>;

    await authenticate({
      accountID,
      accountSecret,
    });

    await this.authSecretStorage.set({
      accountID,
      secretSeed,
      accountSecret,
      provider: "passphrase",
    });

    this.passphrase = passphrase;
    this.notify();
  };

  signUp = async () => {
    const credentials = await this.authSecretStorage.get();

    if (!credentials || !credentials.secretSeed) {
      throw new Error("No credentials found");
    }

    const passphrase = entropyToMnemonic(credentials.secretSeed, this.wordlist);

    await this.authSecretStorage.set({
      accountID: credentials.accountID,
      secretSeed: credentials.secretSeed,
      accountSecret: credentials.accountSecret,
      provider: "passphrase",
    });

    return passphrase;
  };

  getCurrentAccountPassphrase = async () => {
    const credentials = await this.authSecretStorage.get();

    if (!credentials || !credentials.secretSeed) {
      throw new Error("No credentials found");
    }

    return entropyToMnemonic(credentials.secretSeed, this.wordlist);
  };

  loadCurrentAccountPassphrase = async () => {
    const passphrase = await this.getCurrentAccountPassphrase();
    this.passphrase = passphrase;
    this.notify();
  };

  listeners = new Set<() => void>();
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  };

  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
