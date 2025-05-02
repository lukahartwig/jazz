"use client";

import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/contexts/Auth";
import { Alert } from "@garden-co/design-system/design-system/src/components/atoms/Alert";
import { TextLink } from "@garden-co/design-system/design-system/src/components/atoms/TextLink";
import { Input } from "@garden-co/design-system/design-system/src/components/molecules/Input";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";

const title = "Sign in to Jazz Cloud";

export default function SignInPage() {
  const auth = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <h1 className="sr-only">{title}</h1>
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

        {error && (
          <Alert variant="warning" title="Sign In">
            {error.message}
          </Alert>
        )}

        {loading && <Loading />}

        <form
          className="flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            await auth.authClient.signIn.email(
              {
                email,
                password,
                rememberMe,
              },
              {
                onSuccess: async () => {
                  await auth.logIn();
                  redirect("/");
                },
                onError: (error) => {
                  setError(error.error);
                },
              },
            );
            setLoading(false);
          }}
        >
          <Input
            label="Email address"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="items-center">
            <Input
              label="Remember me"
              type="checkbox"
              className="text-sm truncate float-left gap-4 flex"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link href="/forgot" className="text-sm float-right">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" disabled={loading}>
            Sign in
          </Button>
        </form>

        <div className="flex items-center gap-4">
          <hr className="flex-1" />
          <p className="text-center">or</p>
          <hr className="flex-1" />
        </div>

        <div className="flex flex-col gap-4">
          <Button
            variant="secondary"
            className="relative"
            onClick={async (e) => {
              e.preventDefault();
              setLoading(true);
              const { error } = await auth.authClient.signIn.social({
                provider: "github",
                callbackURL: `${window.location.origin}/social/logIn`,
              });
              if (error) {
                setError({
                  ...error,
                  name: error.message ?? error.statusText,
                  message: error.message ?? error.statusText,
                });
              }
              setLoading(false);
            }}
          >
            <SiGithub size={16} className="absolute left-3" />
            Continue with GitHub
          </Button>
        </div>

        <p className="text-sm">
          Don't have an account? <TextLink href="/sign-up">Sign up</TextLink>
        </p>
      </div>
    </div>
  );
}
