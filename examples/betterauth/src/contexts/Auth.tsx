"use client";

import { createAuthClient } from "better-auth/client";
import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";
import { jazzClientPlugin } from "jazz-betterauth-client-plugin";
import { useBetterAuth } from "jazz-react-auth-betterauth";
import { createContext, useContext } from "react";

const authClient = () =>
  useBetterAuth(
    createAuthClient({
      baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
      plugins: [jazzClientPlugin(), magicLinkClient(), emailOTPClient()],
    }),
  );

const AuthContext = createContext<ReturnType<typeof authClient> | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={authClient()}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
