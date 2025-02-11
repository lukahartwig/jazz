import { untrack } from "svelte";
import { getAuthSecretStorage, getJazzContext } from "../jazz.svelte.js";
import { useIsAuthenticated } from "./useIsAuthenticated.svelte.js";
import { PassphraseAuth } from "jazz-tools";

/** @category Auth Providers */
export function usePassphraseAuth({
  wordlist,
}: {
  wordlist: string[];
}) {
  const context = getJazzContext();
  const authSecretStorage = getAuthSecretStorage();
  const auth = new PassphraseAuth(
    context.current.node.crypto,
    context.current.authenticate,
    authSecretStorage,
    wordlist
  );

  let passphrase = $state(auth.passphrase);

  $effect(untrack(() => {
    auth.loadCurrentAccountPassphrase();
    return auth.subscribe(() => {
      passphrase = auth.passphrase;
    });
  }));


  const isAuthenticated = useIsAuthenticated();

  const state = $derived(isAuthenticated.value ? "signedIn" : "anonymous");

  return {
    logIn: auth.logIn,
    signUp: auth.signUp,
    get passphrase() {
      return passphrase;
    },
    get state() {
      return state;
    },
  };
}
