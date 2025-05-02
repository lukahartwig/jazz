"use client";

import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/contexts/Auth";
import { Alert } from "@garden-co/design-system/design-system/src/components/atoms/Alert";
import { Heading } from "@garden-co/design-system/design-system/src/components/atoms/Heading";
import { Input } from "@garden-co/design-system/design-system/src/components/molecules/Input";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const title = "Forgot your password?";

export default function Page() {
  const cloudAuth = useAuth();
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <div className="max-w-md flex flex-col gap-8 w-full px-6 py-12 mx-auto">
        <Link href="/">
          <span className="sr-only">Back to home</span>
          <Image
            src="/jazz-logo.svg"
            alt="Jazz logo"
            width={180}
            height={38}
            priority
          />
        </Link>
        <div>
          <Heading level={1} className="mb-2">
            {title}
          </Heading>
          <p>
            Enter your email address, and we'll send you a link to reset your
            password.
          </p>
        </div>

        {status && (
          <Alert variant="info" title="Forgot Password">
            A link to reset your password has been sent to {email}, if an
            account with that email address exists.
          </Alert>
        )}

        {error && (
          <Alert variant="warning" title="Forgot Password">
            {error.message}
          </Alert>
        )}

        {loading && <Loading />}

        <form
          className="flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const { data, error } = await cloudAuth.authClient.forgetPassword({
              email: email,
              redirectTo: `${window.location.origin}/reset`,
            });
            setStatus(data?.status ?? false);
            const errorMessage = error?.message ?? error?.statusText;
            setError(
              error
                ? {
                    ...error,
                    name: error.statusText,
                    message:
                      errorMessage && errorMessage.length > 0
                        ? errorMessage
                        : "An error occurred",
                  }
                : undefined,
            );
            setLoading(false);
          }}
        >
          <Input
            label="Email address"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            Send recovery link
          </Button>
        </form>

        <Button href="/sign-in" disabled={loading}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
