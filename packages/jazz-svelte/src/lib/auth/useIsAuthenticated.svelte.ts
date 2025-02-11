import { getAuthSecretStorage } from "../jazz.svelte.js";
import { onDestroy } from "svelte";

export function useIsAuthenticated() {
    const authSecretStorage = getAuthSecretStorage();

    let isAuthenticated = $state(authSecretStorage.isAuthenticated);

    const unsubscribe = authSecretStorage.onUpdate(() => {
        isAuthenticated = authSecretStorage.isAuthenticated;
    });

    onDestroy(() => {
        unsubscribe();
    });

    return {
        get value() {
            return isAuthenticated;
        }
    };
}