"use client";

import { useBetterAuth } from "jazz-react-auth-betterauth";
import { createContext, useContext } from "react";

const AuthContext = createContext<ReturnType<typeof useBetterAuth> | null>(
  null,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useBetterAuth({
    baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
  });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
