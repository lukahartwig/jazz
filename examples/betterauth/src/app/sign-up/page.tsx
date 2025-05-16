"use client";

import { LoginForm } from "jazz-cloud-ui";

export default function SignUpPage() {
  const props = {
    operation: "sign-up" as Parameters<typeof LoginForm>["0"]["operation"],
    supportOtp: true,
    providers: ["github"] as Parameters<typeof LoginForm>["0"]["providers"],
    signInUrl: "/sign-in",
    forgotPasswordUrl: "/forgot",
    ssoCallbackUrl: `${window.location.origin}/social/signIn`,
    magicLinkCallbackUrl: `${window.location.origin}/magic-link/signIn`,
  };
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm {...props} />
      </div>
    </div>
  );
}
