import * as bip39 from "@scure/bip39";
import { cojsonInternals } from "cojson";
import { Account, ID, JazzContextManager } from "jazz-tools";

/**
 * `BrowserPassphraseAuth` provides a `JazzAuth` object for passphrase authentication.
 *
 * ```ts
 * import { BrowserPassphraseAuth } from "jazz-browser";
 *
 * const auth = new BrowserPassphraseAuth(driver, wordlist);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserPassphraseAuth {
  constructor(
    private context: JazzContextManager<Account>,
    public wordlist: string[],
  ) {}

  async logIn(passphrase: string) {
    const secretSeed = bip39.mnemonicToEntropy(
      passphrase,
      this.wordlist,
    );
    const accountSecret = this.context.crypto.agentSecretFromSecretSeed(secretSeed);

    if (!accountSecret) {
      throw new Error("Invalid passphrase");
    }

    const accountID = cojsonInternals.idforHeader(
      cojsonInternals.accountHeaderForInitialAgentSecret(
        accountSecret,
        this.context.crypto,
      ),
      this.context.crypto,
    ) as ID<Account>;

    return this.context.logIn({
      accountID,
      accountSecret,
      secretSeed,
      isAnonymous: false,
    });
  }

  async registerCredentials(username: string, passphrase: string) {
    const secretSeed = bip39.mnemonicToEntropy(
      passphrase,
      this.wordlist,
    );
    const accountSecret = this.context.crypto.agentSecretFromSecretSeed(secretSeed);

    return this.context.registerNewAccount({
      accountSecret,
      secretSeed,
      isAnonymous: false,
    }, {
      name: username,
    });
  }
}
