"use client";

import { LoginForm } from "jazz-cloud-ui";

export default function SignInPage() {
  const props = {
    operation: "sign-in" as Parameters<typeof LoginForm>["0"]["operation"],
    supportOtp: true,
    providers: ["github"] as Parameters<typeof LoginForm>["0"]["providers"],
    signUpUrl: "/sign-up",
    forgotPasswordUrl: "/forgot",
    ssoCallbackUrl: `${window.location.origin}/social/logIn`,
    magicLinkCallbackUrl: `${window.location.origin}/magic-link/logIn`,
  };
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm {...props} />
      </div>
    </div>
  );
}
