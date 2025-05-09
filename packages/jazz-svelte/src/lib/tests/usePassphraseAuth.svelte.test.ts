// @vitest-environment happy-dom

import { render } from "@testing-library/svelte";
import { AuthSecretStorage } from "jazz-tools";
import { describe, expect, it, beforeEach } from "vitest";
import { createJazzTestAccount, createJazzTestContext, setupJazzTestSync } from "../testing.js";
import { testWordlist } from "./fixtures.js";
import UsePassphraseAuth from "./components/usePassphraseAuth.svelte";

beforeEach(async () => {
  await setupJazzTestSync();
});

type Result = {
  state: string;
  passphrase: string;
  logIn: (passphrase: string) => Promise<void>;
  signUp: (name?: string) => Promise<string>;
}

async function setup() {
  const result = { current: null as Result | null };

  render(UsePassphraseAuth, {
    context: createJazzTestContext({ account: await createJazzTestAccount() }),
    props: {
      wordlist: testWordlist,
      setResult: (value) => {
        result.current = value;
      },
    },
  });

  return result;
}

describe("usePassphraseAuth", () => {
  it("should initialize in anonymous state", async () => {
    const result = await setup();
    expect(result.current?.state).toBe("anonymous");
  });

  it("should generate passphrase on signup", async () => {
    const result = await setup();
    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    const passphrase = await result.current?.signUp();
    expect(passphrase).toBeDefined();
    expect(typeof passphrase).toBe("string");
    expect(passphrase?.split(" ").length).toBeGreaterThan(0);

    expect(await authSecretStorage.get()).toMatchObject({
      ...credentialsBefore,
      provider: "passphrase",
    });
  });

  it("should log in with the previous passphrase", async () => {
    const result = await setup();
    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    const passphrase = await result.current?.signUp();
    if (!passphrase || !result.current) throw new Error("Failed to sign up");
    
    await result.current.logIn(passphrase);

    expect(result.current.state).toBe("signedIn");
    expect(await authSecretStorage.get()).toMatchObject({
      ...credentialsBefore,
      provider: "passphrase",
    });
  });

  it("should fail to log in with invalid passphrase", async () => {
    const result = await setup();
    if (!result.current) throw new Error("Auth not initialized");
    
    await expect(result.current.logIn("invalid words here")).rejects.toThrow(
      "Invalid passphrase"
    );
    expect(result.current.state).toBe("anonymous");
  });
}); 
