"use client";

import { Alert } from "@garden-co/design-system/design-system/src/components/atoms/Alert";
import { useAuth } from "jazz-react-auth-betterauth";
import { redirect } from "next/navigation";

export default function Page() {
  const { auth } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");
  if (!error) {
    auth.logIn().then(redirect("/"));
    return null;
  } else {
    return (
      <div className="min-h-screen flex flex-col justify-center">
        <div className="max-w-md flex flex-col gap-8 w-full px-6 py-12 mx-auto">
          <Alert variant="warning" title="Sign In">
            {error}
          </Alert>
        </div>
      </div>
    );
  }
}
