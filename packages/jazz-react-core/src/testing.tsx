import { Account, AnonymousJazzAgent } from "jazz-tools";
import { TestJazzContextManager } from "jazz-tools/testing";
import { useCallback, useState, useSyncExternalStore } from "react";
import { JazzAuthContext, JazzContext } from "./provider.js";

export function JazzTestProvider<Acc extends Account>({
  children,
  account,
  isAuthenticated,
}: {
  children: React.ReactNode;
  account?: Acc | { guest: AnonymousJazzAgent };
  isAuthenticated?: boolean;
}) {
  const [contextManager] = useState(() => {
    return TestJazzContextManager.fromAccountOrGuest<Acc>(account, {
      isAuthenticated,
    });
  });

  const value = useSyncExternalStore(
    useCallback((callback) => contextManager.subscribe(callback), []),
    () => contextManager.getCurrentValue(),
    () => contextManager.getCurrentValue(),
  );

  return (
    <JazzContext.Provider value={value}>
      <JazzAuthContext.Provider value={contextManager.getAuthSecretStorage()}>
        {children}
      </JazzAuthContext.Provider>
    </JazzContext.Provider>
  );
}

export {
  createJazzTestAccount,
  createJazzTestGuest,
  linkAccounts,
  setActiveAccount,
  setupJazzTestSync,
} from "jazz-tools/testing";
