"use client";

import { ResetPasswordForm } from "jazz-cloud-ui";

export default function ResetPage() {
  const props = {
    signInUrl: "/sign-in",
  } as Parameters<typeof ResetPasswordForm>["0"];
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <ResetPasswordForm {...props} />
      </div>
    </div>
  );
}
