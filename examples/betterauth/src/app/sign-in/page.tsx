"use client";

import { LoginForm } from "jazz-cloud-ui";

export default function SignInPage() {
  const props = {
    redirectUrl: "/",
    operation: "sign-in",
    supportOtp: true,
    supportMagicLink: true,
    providers: ["github"],
    signUpUrl: "/sign-up",
    forgotPasswordUrl: "/forgot",
    ssoCallbackUrl: `${window.location.origin}`,
    magicLinkCallbackUrl: `${window.location.origin}`,
  } as Parameters<typeof LoginForm>["0"];
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm {...props} />
      </div>
    </div>
  );
}
