// @vitest-environment happy-dom

import {
  AuthSecretStorage,
  ID,
  KvStoreContext,
  SecretURLAuthTransfer,
} from "jazz-tools";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSecretURLAuth } from "../auth/SecretURLAuth";
import {
  createJazzTestAccount,
  createJazzTestGuest,
  setupJazzTestSync,
} from "../testing";
import { act, renderHook, waitFor } from "./testUtils";

describe("useSecretURLAuth", () => {
  beforeEach(async () => {
    await setupJazzTestSync();
    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });
  });

  afterEach(() => {
    KvStoreContext.getInstance().getStorage().clearAll();
  });

  it("throws error when using guest account", async () => {
    const guestAccount = await createJazzTestGuest();

    expect(() =>
      renderHook(() => useSecretURLAuth(window.location.origin), {
        account: guestAccount,
      }),
    ).toThrow();
  });

  it("should show signed in state with authenticated account", async () => {
    const { result } = renderHook(
      () => useSecretURLAuth(window.location.origin),
      { isAuthenticated: true },
    );

    expect(result.current.state).toBe("signedIn");
  });

  it("should set status after generating link", async () => {
    const { result } = renderHook(
      () => useSecretURLAuth(window.location.origin),
      { isAuthenticated: true },
    );

    expect(result.current.status).toBe("idle");

    let url = "";
    await act(async () => {
      url = await result.current.createUrl();
    });

    expect(url).toBeDefined();

    expect(result.current.status).toBe("init");
  });

  it("should log in", async () => {
    const { result } = renderHook(
      () => useSecretURLAuth(window.location.origin),
      { isAuthenticated: true },
    );

    let url = "";
    await act(async () => {
      url = await result.current.createUrl();
    });

    const id = url.match(
      /invite\/authTransfer\/(co_.*)\/.*/,
    )?.[1] as ID<SecretURLAuthTransfer>;

    let transfer: SecretURLAuthTransfer | undefined;

    await act(async () => {
      transfer = await result.current.logIn(id);
    });

    expect(transfer?.status).toBe("authorized");
  });
});
