import { useEffect, useState } from "react";
import { useAuthSecretStorage } from "../hooks.js";

export function useIsAuthenticated() {
  const authSecretStorage = useAuthSecretStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(
    authSecretStorage.isAuthenticated,
  );

  useEffect(() => {
    return authSecretStorage.onUpdate(setIsAuthenticated);
  }, []);

  return isAuthenticated;
}
