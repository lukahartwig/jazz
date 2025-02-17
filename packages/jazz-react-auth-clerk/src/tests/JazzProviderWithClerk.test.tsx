// @vitest-environment happy-dom

import { act, render } from "@testing-library/react";
import type { MinimalClerkClient } from "jazz-auth-clerk";
import { AuthSecretStorage, InMemoryKVStore, KvStoreContext } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JazzProviderWithClerk } from "../index";

vi.mock("jazz-react", async (importOriginal) => {
  const { JazzTestProvider, createJazzTestAccount } = await import(
    "jazz-react/testing"
  );

  const account = await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });

  function JazzProvider(props: { children: React.ReactNode }) {
    return (
      <JazzTestProvider account={account}>{props.children}</JazzTestProvider>
    );
  }

  return {
    ...(await importOriginal<typeof import("jazz-react")>()),
    JazzProvider,
  };
});

const authSecretStorage = new AuthSecretStorage();
KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("JazzProviderWithClerk", () => {
  beforeEach(async () => {
    await authSecretStorage.clear();
  });

  const setup = (
    children = <div data-testid="test-child">Test Content</div>,
  ) => {
    let callbacks = new Set<(clerk: MinimalClerkClient) => void>();

    const mockClerk = {
      user: {
        fullName: "Test User",
        unsafeMetadata: {},
        update: vi.fn(),
      },
      signOut: vi.fn().mockImplementation(() => {
        mockClerk.user = null;
        Array.from(callbacks).map((callback) => callback(mockClerk));
      }),
      addListener: vi.fn((callback) => {
        callbacks.add(callback);

        return () => {
          callbacks.delete(callback);
        };
      }),
    } as unknown as MinimalClerkClient;

    const utils = render(
      <JazzProviderWithClerk
        clerk={mockClerk}
        sync={{ peer: "wss://test.jazz.tools" }}
      >
        {children}
      </JazzProviderWithClerk>,
    );

    return {
      ...utils,
      mockClerk,
      callbacks,
    };
  };

  it("should push the local credentials to clerk", async () => {
    const { mockClerk, callbacks } = setup();

    expect(mockClerk.user?.update).not.toHaveBeenCalled();

    await act(async () => {
      await Promise.all(
        Array.from(callbacks).map((callback) => callback(mockClerk)),
      );
    });

    expect(mockClerk.user?.update).toHaveBeenCalledWith({
      unsafeMetadata: {
        jazzAccountID: expect.any(String),
        jazzAccountSecret: expect.any(String),
        jazzAccountSeed: expect.any(Array),
      },
    });
  });
});
