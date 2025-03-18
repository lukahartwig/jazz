import {
  CryptoProvider,
  base64URLtoBytes,
  bytesToBase64url,
  cojsonInternals,
} from "cojson";
import { Account } from "../coValues/account.js";
import { CoMap, Group, createInviteLink } from "../exports.js";
import { ID, co, subscribeToCoValue } from "../internal.js";
import { AuthenticateAccountFunction } from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

const transferStatuses = [
  "init",
  "pending",
  "authorized",
  "expired",
  "error",
] as const;

export class SecretURLAuthTransfer extends CoMap {
  status = co.literal(...transferStatuses);
  acceptedBy = co.optional.ref(Account);
  secret = co.string;
  expiresAt = co.Date;
}

/**
 * `SecretURLAuth` provides a `JazzAuth` object for secret URL authentication. Good for use in a QR code.
 *
 * ```ts
 * import { SecretURLAuth } from "jazz-tools";
 *
 * const auth = new SecretURLAuth(crypto, jazzContext.authenticate, new AuthSecretStorage(), window.location.origin);
 * ```
 *
 * @category Auth Providers
 */
export class SecretURLAuth {
  constructor(
    private crypto: CryptoProvider,
    private authenticate: AuthenticateAccountFunction,
    private authSecretStorage: AuthSecretStorage,
    private origin: string,
  ) {}

  public status: (typeof transferStatuses)[number] | "idle" = "idle";

  /**
   * Creates an auth transfer URL for the given secret.
   *
   * @param expiresAt - The expiration date. Defaults to 15 minutes from now.
   * @returns The auth transfer URL.
   */
  createAuthTransferURL = async (expiresAt?: Date) => {
    const credentials = await this.authSecretStorage.get();
    if (!credentials?.secretSeed) {
      throw new Error("No existing authentication found");
    }

    const secret = bytesToBase64url(credentials.secretSeed);

    const group = Group.create({ owner: Account.getMe() });
    const transfer = SecretURLAuthTransfer.create(
      {
        status: "init",
        secret: secret,
        expiresAt: expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
      },
      { owner: group },
    );
    await transfer.waitForSync();
    this.status = transfer.status;
    this.notify();

    const url = createInviteLink(
      transfer,
      "writeOnly",
      this.origin,
      "authTransfer",
    );

    waitForTransferProperty(
      transfer.id,
      "acceptedBy",
      Account.getMe(),
      30 * 60 * 1000,
    )
      .then((t) => {
        if (!t.acceptedBy || t.status === "authorized") return;

        if (t.expiresAt < new Date()) {
          t.status = "expired";
          return;
        }

        t._owner.castAs(Group).addMember(t.acceptedBy, "writer");
      })
      .catch(() => {
        transfer.status = "error";
      })
      .finally(async () => {
        await transfer.waitForSync();
        this.status = transfer.status;
        this.notify();
      });

    return { url, transfer };
  };

  /**
   * Accepts an auth transfer and logs in.
   *
   * @param authTransferId - The SecretURLAuthTransfer ID to accept.
   * @param timeoutMs - The timeout in milliseconds. Defaults to 15 seconds.
   * @returns The SecretURLAuthTransfer.
   */
  logIn = async (
    authTransferId: ID<SecretURLAuthTransfer>,
    timeoutMs = 15000,
  ): Promise<SecretURLAuthTransfer> => {
    const transfer = await SecretURLAuthTransfer.load(authTransferId, {});
    if (!transfer) throw new Error("Unable to load authentication transfer");

    transfer.acceptedBy = Account.getMe();
    transfer.status = "pending";
    await transfer.waitForSync();
    this.status = transfer.status;
    this.notify();

    try {
      const { secret } = await waitForTransferProperty(
        transfer.id,
        "secret",
        Account.getMe(),
        timeoutMs,
      );

      transfer.status = "authorized";
      await transfer.waitForSync();
      this.status = transfer.status;
      this.notify();

      const secretSeed = base64URLtoBytes(secret);
      const accountSecret = this.crypto.agentSecretFromSecretSeed(secretSeed);

      const accountID = cojsonInternals.idforHeader(
        cojsonInternals.accountHeaderForInitialAgentSecret(
          accountSecret,
          this.crypto,
        ),
        this.crypto,
      ) as ID<Account>;

      await this.authenticate({ accountID, accountSecret });

      await this.authSecretStorage.set({
        accountID,
        secretSeed,
        accountSecret,
        provider: "secretURL",
      });

      return transfer;
    } catch (e) {
      transfer.status = "error";
      this.status = transfer.status;
      this.notify();
      throw e;
    }
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

/**
 * Waits for a specific property to be set on a SecretURLAuthTransfer object.
 *
 * @param transferId - The ID of the SecretURLAuthTransfer to monitor.
 * @param key - The property key to wait for.
 * @param account - The account to use for loading the transfer
 * @param timeoutMs - Maximum time to wait in milliseconds before timing out (default: 5000ms).
 * @returns Promise that resolves with the SecretURLAuthTransfer once the property is set
 * @throws Error if unable to load transfer or if timeout is reached
 */

export function waitForTransferProperty(
  transferId: ID<SecretURLAuthTransfer>,
  key: keyof SecretURLAuthTransfer,
  account: Account,
  timeoutMs: number = 5000,
): Promise<SecretURLAuthTransfer> {
  let aborted = false;
  let abort = () => {
    aborted = true;
  };

  return new Promise((resolve, reject) => {
    subscribeToCoValue(
      SecretURLAuthTransfer,
      transferId,
      account,
      {},
      (value, unsubscribe) => {
        if (aborted) return;

        abort = () => {
          aborted = true;
          unsubscribe();
          clearTimeout(timeout);
        };

        if (value[key]) {
          resolve(value);
          abort();
        }
      },
      () => {
        reject(new Error("Unable to load transfer"));
      },
    );

    const timeout = setTimeout(() => {
      abort();
      reject(new Error("Timeout waiting for transfer property"));
    }, timeoutMs);
  });
}
