"use client";

import { useAuth } from "jazz-react-auth-betterauth";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert.js";
import { Button } from "../components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { cn } from "../lib/utils.js";

type ResetPasswordFormProps = {
  signInUrl?: string;
};

export function ResetPasswordForm({
  className,
  signInUrl,
  ...props
}: React.ComponentProps<"div"> & ResetPasswordFormProps) {
  const auth = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  const initialError = searchParams.get("error");
  const [error, setError] = useState<Error | undefined>(
    initialError
      ? {
          name: initialError,
          message: initialError,
        }
      : undefined,
  );
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [status, setStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {status && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Password Reset</AlertTitle>
          <AlertDescription>
            Your password has been reset. You may now{" "}
            {signInUrl ? (
              <span>
                <Link href={signInUrl}>sign in</Link>.
              </span>
            ) : (
              "sign in."
            )}
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
          <CardTitle className="text-xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              if (password !== confirmPassword) {
                setError(new Error("Passwords do not match"));
                setLoading(false);
                return;
              }
              if (!token) {
                setError(new Error("No password reset token provided"));
                setLoading(false);
                return;
              }
              const { data, error } = await auth.authClient.resetPassword({
                newPassword: password,
                token,
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
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  Reset password
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
