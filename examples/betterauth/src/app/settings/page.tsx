"use client";

import { LogoutButton, SettingsForm } from "jazz-cloud-ui";

export default function SettingsPage() {
  const props = {
    providers: ["github"],
    deleteAccountRedirectUrl: "/",
  } as Parameters<typeof SettingsForm>["0"];
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <header className="absolute p-4 top-0 left-0 w-fit z-10 flex items-center justify-between gap-4">
        <LogoutButton className="float-start w-fit" redirectUrl="/" />
      </header>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <SettingsForm {...props} />
      </div>
    </div>
  );
}
