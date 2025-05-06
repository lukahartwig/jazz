"use client";

import { createAuthClient } from "better-auth/client";
import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";
import { jazzClientPlugin } from "jazz-betterauth-client-plugin";
import type { AuthCredentials } from "jazz-tools";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { useBetterAuth } from "../index";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { DefaultImage, Image as ImageType } from "../types/image";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { DefaultLink, Link as LinkType } from "../types/link";
// biome-ignore lint/correctness/useImportExtensions: <explanation>
import { defaultNavigate, defaultReplace } from "../types/router";

const newAuthClient = () =>
  createAuthClient({
    plugins: [jazzClientPlugin(), magicLinkClient(), emailOTPClient()],
  });

const authClient = (...[props]: Parameters<typeof useBetterAuth>) => {
  const auth = useBetterAuth(props as ReturnType<typeof newAuthClient>);
  const [user, setUser] = useState<AuthCredentials | undefined>(undefined);
  const [account, setAccount] = useState<
    typeof auth.authClient.$Infer.Session.user | undefined
  >(undefined);
  const updateUser = useCallback(() => {
    auth.authClient.jazzPlugin
      .decryptCredentials()
      .then((x) => {
        setUser(x.data === null ? undefined : x.data);
      })
      .catch((error) => {
        console.error("Error decrypting credentials:", error);
      });
  }, [auth.authClient.jazzPlugin]);
  useEffect(() => {
    auth.authClient.useSession.subscribe(({ data }) => {
      if (data?.user) setAccount(data.user);
      if (data?.user.encryptedCredentials) {
        updateUser();
      } else if (data && !data.user.encryptedCredentials) {
        auth.signIn().then(() => {
          updateUser();
        });
      }
    });
  }, [user, account]);
  return {
    auth: auth,
    user: user,
    account: account,
  };
};

const AuthContext = createContext<
  | (ReturnType<typeof authClient> & {
      Link: LinkType;
      Image: ImageType;
      navigate: typeof defaultNavigate;
      replace: typeof defaultReplace;
    })
  | null
>(null);

export function AuthProvider({
  children,
  Image = DefaultImage,
  Link = DefaultLink,
  navigate = defaultNavigate,
  replace = defaultReplace,
  client,
}: {
  children: React.ReactNode;
  Image?: ImageType;
  Link?: LinkType;
  navigate?: typeof defaultNavigate;
  replace?: typeof defaultReplace;
  client: Parameters<typeof useBetterAuth>[0];
}) {
  return (
    <AuthContext.Provider
      value={{ ...authClient(client), Image, Link, navigate, replace }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
