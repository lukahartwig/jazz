import {
  type AuthClient,
  BetterAuth,
  type Session,
  newAuthClient,
} from "jazz-auth-betterauth";
import {
  useAuthSecretStorage,
  useIsAuthenticated,
  useJazzContext,
} from "jazz-react";
import { useEffect, useMemo } from "react";

/**
 * @category Auth Providers
 */
export function useBetterAuth(...props: Parameters<typeof newAuthClient>): {
  readonly state: "signedIn" | "anonymous";
  readonly logIn: () => Promise<void>;
  readonly signIn: () => Promise<void>;
  readonly authClient: AuthClient;
} {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();
  const authClient: AuthClient = newAuthClient(...props);

  if ("guest" in context) {
    throw new Error("Better Auth is not supported in guest mode");
  }

  const authMethod = useMemo(() => {
    return new BetterAuth(context.authenticate, authSecretStorage, authClient);
  }, []);

  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    authClient.useSession.subscribe((value) => {
      authMethod.onUserChange(value.data as Pick<Session, "user">);
    });
  }, []);

  return {
    state: isAuthenticated ? "signedIn" : "anonymous",
    logIn: authMethod.logIn,
    signIn: authMethod.signIn,
    authClient,
  } as const;
}
