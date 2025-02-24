import {
  JazzClerkAuth,
  type MinimalClerkClient,
  isClerkCredentials,
} from "jazz-auth-clerk";
import { LocalStorageKVStore } from "jazz-browser";
import {
  JazzProvider,
  JazzProviderProps,
  useAuthSecretStorage,
  useJazzContext,
} from "jazz-react";
import { AuthSecretStorage, InMemoryKVStore, KvStoreContext } from "jazz-tools";
import { useEffect, useMemo, useState } from "react";

function useJazzClerkAuth(clerk: MinimalClerkClient) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  if ("guest" in context) {
    throw new Error("Clerk auth is not supported in guest mode");
  }

  const authMethod = useMemo(() => {
    return new JazzClerkAuth(context.authenticate, authSecretStorage);
  }, []);

  useEffect(() => {
    // Need to use addListener because the clerk user object is not updated when the user logs in
    return clerk.addListener((event) => {
      authMethod.onClerkUserChange(event as Pick<MinimalClerkClient, "user">);
    });
  }, []);
}

function RegisterClerkAuth(props: {
  clerk: MinimalClerkClient;
  children: React.ReactNode;
}) {
  useJazzClerkAuth(props.clerk);

  return props.children;
}

export const JazzProviderWithClerk = (
  props: { clerk: MinimalClerkClient } & JazzProviderProps,
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  setupKvStore();
  const secretStorage = new AuthSecretStorage();

  useEffect(() => {
    if (!isClerkCredentials(props.clerk.user?.unsafeMetadata)) {
      setIsLoaded(true);
      return;
    }

    JazzClerkAuth.loadClerkAuthData(
      props.clerk.user.unsafeMetadata,
      secretStorage,
    ).then(() => {
      setIsLoaded(true);
    });
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <JazzProvider {...props} onLogOut={props.clerk.signOut}>
      <RegisterClerkAuth clerk={props.clerk}>
        {props.children}
      </RegisterClerkAuth>
    </JazzProvider>
  );
};

function setupKvStore() {
  KvStoreContext.getInstance().initialize(
    typeof window === "undefined"
      ? new InMemoryKVStore()
      : new LocalStorageKVStore(),
  );
}
