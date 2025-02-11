// @vitest-environment happy-dom

import { mnemonicToEntropy } from "@scure/bip39";
import { AgentSecret } from "cojson";
import {
  Account,
  AuthSecretStorage,
  ID,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassphraseAuth } from "../auth/PassphraseAuth";
import { createJazzTestAccount } from "../testing";
import { TestJSCrypto } from "../testing";
import { testWordlist } from "./fixtures";

// Initialize KV store for tests
KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("PassphraseAuth", () => {
  let crypto: TestJSCrypto;
  let mockAuthenticate: any;
  let authSecretStorage: AuthSecretStorage;
  let passphraseAuth: PassphraseAuth;

  beforeEach(async () => {
    // Reset storage
    KvStoreContext.getInstance().getStorage().clearAll();

    // Set up crypto and mocks
    crypto = await TestJSCrypto.create();
    mockAuthenticate = vi.fn();
    authSecretStorage = new AuthSecretStorage();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });

    // Create PassphraseAuth instance
    passphraseAuth = new PassphraseAuth(
      crypto,
      mockAuthenticate,
      authSecretStorage,
      testWordlist,
    );
  });

  describe("logIn", () => {
    it("should successfully log in with valid passphrase", async () => {
      const storageData = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
        secretSeed: new Uint8Array([
          173, 58, 235, 40, 67, 188, 236, 11, 107, 237, 97, 23, 182, 49, 188,
          63, 237, 52, 27, 84, 142, 66, 244, 149, 243, 114, 203, 164, 115, 239,
          175, 194,
        ]),
        provider: "anonymous",
      };

      await authSecretStorage.set(storageData);

      // Generate a valid passphrase
      const passphrase = await passphraseAuth.getCurrentAccountPassphrase();

      await passphraseAuth.logIn(passphrase);

      expect(mockAuthenticate).toHaveBeenCalledWith({
        accountID: expect.any(String),
        accountSecret: expect.any(String),
      });

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        accountID: expect.any(String),
        accountSecret: expect.any(String),
        secretSeed: storageData.secretSeed,
        provider: "passphrase",
      });
    });

    it("should throw error with invalid passphrase", async () => {
      await expect(passphraseAuth.logIn("invalid words here")).rejects.toThrow(
        "Invalid passphrase",
      );
    });
  });

  describe("signUp", () => {
    it("should successfully sign up new user", async () => {
      const storageData = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
        secretSeed: new Uint8Array([
          173, 58, 235, 40, 67, 188, 236, 11, 107, 237, 97, 23, 182, 49, 188,
          63, 237, 52, 27, 84, 142, 66, 244, 149, 243, 114, 203, 164, 115, 239,
          175, 194,
        ]),
        provider: "anonymous",
      };

      await authSecretStorage.set(storageData);

      const passphrase = await passphraseAuth.signUp();

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        accountID: storageData.accountID,
        accountSecret: storageData.accountSecret,
        secretSeed: storageData.secretSeed,
        provider: "passphrase",
      });
      expect(passphrase).toMatchInlineSnapshot(
        `"pudding struggle skate manual solution aisle quick promote bless ranch humor lemon spy asset fall sign virus question syrup nuclear elbow water sample garden"`,
      );
    });

    it("should throw error when no credentials found", async () => {
      await expect(passphraseAuth.signUp()).rejects.toThrow(
        "No credentials found",
      );
    });
  });

  describe("getCurrentAccountPassphrase", () => {
    it("should return current user passphrase when credentials exist", async () => {
      const storageData = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
        secretSeed: crypto.newRandomSecretSeed(),
        provider: "anonymous",
      };

      await authSecretStorage.set(storageData);

      // First sign up to create valid credentials
      const originalPassphrase = await passphraseAuth.signUp();

      // Then get the current passphrase
      const retrievedPassphrase =
        await passphraseAuth.getCurrentAccountPassphrase();
      expect(retrievedPassphrase).toBe(originalPassphrase);
    });

    it("should throw error when no credentials found", async () => {
      await expect(
        passphraseAuth.getCurrentAccountPassphrase(),
      ).rejects.toThrow("No credentials found");
    });
  });
});
