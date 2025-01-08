import { useMemo, useRef, useState } from "react";
import { ExpoSecureStoreAdapter } from "../storage/expo-secure-store-adapter.js";
import { KvStore } from "../storage/kv-store-context.js";
import { PasskeyWebView } from "./PasskeyWebView.js";
import { RNPasskeyAuth } from "./RNPasskeyAuth.js";

export type PasskeyAuthState =
  | { state: "uninitialized"; errors: string[] }
  | { state: "loading"; errors: string[] }
  | {
      state: "ready";
      errors: string[];
      signUp: (username: string) => Promise<void>;
      logIn: () => Promise<void>;
    }
  | { state: "signedIn"; errors: string[]; logOut: () => void };

export function useRNPasskeyAuth({
  appName,
  appHostname,
  kvStore = new ExpoSecureStoreAdapter(),
}: {
  appName: string;
  appHostname: string;
  kvStore?: KvStore;
}) {
  const [authState, setAuthState] = useState<PasskeyAuthState>({
    state: "loading",
    errors: [],
  });

  const webViewRef = useRef<PasskeyWebView>(null);

  const authMethod = useMemo(
    () =>
      new RNPasskeyAuth(
        {
          onReady({ signUp, logIn }) {
            setAuthState({
              state: "ready",
              errors: [],
              signUp,
              logIn,
            });
          },
          onSignedIn({ logOut }) {
            setAuthState({
              state: "signedIn",
              errors: [],
              logOut: () => {
                logOut();
                setAuthState({ state: "loading", errors: [] });
              },
            });
          },
          onError(error: string | Error) {
            setAuthState((prev) => ({
              ...prev,
              errors: [...prev.errors, String(error)],
            }));
          },
        },
        webViewRef,
        appName,
        appHostname,
        kvStore,
      ),
    [appName, appHostname, kvStore],
  );

  return { authMethod, authState, webViewRef };
}
