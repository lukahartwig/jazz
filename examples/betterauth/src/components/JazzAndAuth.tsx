"use client";

import { createAuthClient } from "better-auth/client";
import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";
import { jazzClientPlugin } from "jazz-betterauth-client-plugin";
import { JazzProvider } from "jazz-react";
import { AuthProvider } from "jazz-react-auth-betterauth";
import * as NextImage from "next/image";
import * as NextLink from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, lazy } from "react";

const JazzDevTools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("jazz-inspector").then((res) => ({
          default: res.JazzInspector,
        })),
      );

export function JazzAndAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <JazzProvider
      sync={{ peer: "wss://cloud.jazz.tools/?key=dashboard@garden.co" }}
    >
      <>
        <AuthProvider
          Link={NextLink.default}
          Image={NextImage.default}
          navigate={router.push}
          replace={router.replace}
          client={createAuthClient({
            baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
            plugins: [jazzClientPlugin(), magicLinkClient(), emailOTPClient()],
          })}
        >
          {children}
        </AuthProvider>
        <JazzDevTools />
      </>
    </JazzProvider>
  );
}
