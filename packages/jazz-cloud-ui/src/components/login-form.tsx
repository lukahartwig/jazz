"use client";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
  FullAuthClient,
  SSOProviderType,
  useAuth,
} from "jazz-react-auth-betterauth";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.js";
import { Button } from "../components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { SSOButton } from "../components/ui/sso-button.js";
import { cn } from "../lib/utils.js";
import { MagicLinkButton } from "./ui/magic-link-button.js";
import { SendOtpButton } from "./ui/send-otp-button.js";

type LoginFormProps = {
  operation: "sign-in" | "sign-up";
  supportOtp: boolean;
  supportMagicLink: boolean;
  providers?: SSOProviderType[];
  redirectUrl?: string;
  footer?: React.ReactNode;
  ssoCallbackUrl?: string;
  magicLinkCallbackUrl?: string;
  signUpUrl?: string;
  signInUrl?: string;
  forgotPasswordUrl?: string;
};

export function LoginForm({
  className,
  operation,
  supportOtp = false,
  supportMagicLink = false,
  providers,
  redirectUrl,
  footer,
  ssoCallbackUrl,
  magicLinkCallbackUrl,
  signUpUrl,
  signInUrl,
  forgotPasswordUrl,
  ...props
}: React.ComponentProps<"div"> & LoginFormProps) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState<string>("");
  const [otpStatus, setOtpStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [name, setName] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const submitSignIn = async () => {
    if (supportOtp && !otpStatus) {
      await auth.authClient.signIn.email(
        {
          email,
          password,
          rememberMe,
        },
        {
          onSuccess: async () => {
            if (redirectUrl) router.push(redirectUrl);
          },
          onError: (error) => {
            setError(error.error);
          },
        },
      );
    } else {
      const { data, error } = await (
        auth.authClient as FullAuthClient
      ).signIn.emailOtp({
        email: email,
        otp: otp,
      });
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
      if (data && redirectUrl) {
        router.push(redirectUrl);
      }
    }
  };

  const submitSignUp = async () => {
    if (password !== confirmPassword) {
      setError(new Error("Passwords do not match"));
      setLoading(false);
      return;
    }
    if (supportOtp && !otpStatus) {
      await auth.authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onSuccess: async () => {
            if (redirectUrl) router.push(redirectUrl);
          },
          onError: (error) => {
            setError(error.error);
          },
        },
      );
    } else {
      const { data, error } = await (
        auth.authClient as FullAuthClient
      ).signIn.emailOtp({
        email: email,
        otp: otp,
      });
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
      if (data && redirectUrl) {
        router.push(redirectUrl);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {otpStatus && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OTP</AlertTitle>
          <AlertDescription>
            A one-time password has been sent to your email.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {operation === "sign-in" ? "Welcome back" : "Greetings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              if (operation === "sign-in") {
                await submitSignIn();
              } else if (operation === "sign-up") {
                await submitSignUp();
              }
              setLoading(false);
            }}
          >
            <div className="grid gap-6">
              {(supportOtp || providers || supportMagicLink) && (
                <div className="flex flex-col gap-4">
                  {supportOtp && (
                    <SendOtpButton
                      operation={operation}
                      email={email}
                      setOtpStatus={setOtpStatus}
                      setLoading={setLoading}
                      setError={setError}
                    />
                  )}
                  {supportMagicLink && (
                    <MagicLinkButton
                      callbackURL={magicLinkCallbackUrl}
                      operation={operation}
                      email={email}
                      setLoading={setLoading}
                      setError={setError}
                    />
                  )}
                  {providers?.map((x) => {
                    return (
                      <SSOButton
                        key={useId()}
                        callbackURL={ssoCallbackUrl}
                        operation={operation}
                        provider={x}
                        setLoading={setLoading}
                        setError={setError}
                      />
                    );
                  })}
                </div>
              )}
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                {operation === "sign-up" && (
                  <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Name"
                      value={name}
                      disabled={loading}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    {!otpStatus && <Label htmlFor="password">Password</Label>}
                    {supportOtp && otpStatus && (
                      <Label htmlFor="otp">One-time password</Label>
                    )}
                    {!otpStatus &&
                      forgotPasswordUrl &&
                      operation === "sign-in" && (
                        <a
                          href={forgotPasswordUrl}
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      )}
                  </div>
                  {!otpStatus && (
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      disabled={loading}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  )}
                  {supportOtp && otpStatus && (
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      value={otp}
                      disabled={loading}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                  {operation === "sign-in" && (
                    <div className="flex items-center">
                      <Label htmlFor="remember-me">Remember me</Label>
                      <Input
                        id="remember-me"
                        type="checkbox"
                        className="w-1/6 ml-auto"
                        checked={rememberMe}
                        disabled={loading}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                    </div>
                  )}
                </div>
                {!otpStatus && operation === "sign-up" && (
                  <div className="grid gap-3">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      disabled={loading}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {operation === "sign-in" ? "Login" : "Register"}
                </Button>
              </div>
              {operation === "sign-in" && signUpUrl && (
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href={signUpUrl} className="underline underline-offset-4">
                    Sign up
                  </a>
                </div>
              )}
              {operation === "sign-up" && signInUrl && (
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <a href={signInUrl} className="underline underline-offset-4">
                    Sign in
                  </a>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {footer && (
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          {footer}
        </div>
      )}
    </div>
  );
}
